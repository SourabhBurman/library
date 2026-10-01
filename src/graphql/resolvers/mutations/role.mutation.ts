import { GraphQLError } from "graphql";
import { In } from "typeorm";
import { DBModle } from "../../../config/db.connection";
import { Role } from "../../../entity/role.entity";
import { Permission } from "../../../entity/permission.entity";
import { User } from "../../../entity/user.entity";
import { ROLE } from "../../../enums";
import { requireRole } from "../../../util/auth";
import { logAudit } from "../../../util/auditLog";

const RoleRepository = DBModle.dbInstance.getRepository(Role);
const PermissionRepository = DBModle.dbInstance.getRepository(Permission);
const UserRepository = DBModle.dbInstance.getRepository(User);

export const roleMutation = {
  createRole: async (_, args: { input: Role }, context: any) => {
    requireRole(context, ROLE.ADMIN);
    const { type, displayName, permissions } = args.input;

    try {
      const newRole = RoleRepository.create({
        type,
        displayName,
        permissions,
      });

      const savedRole = await RoleRepository.save(newRole);
      await logAudit(context, "role.create", "Role", String(savedRole.id), {
        type,
        displayName,
      });
      return savedRole;
    } catch (error) {
      console.error("Error creating role:", error);
      throw new Error("Failed to create role");
    }
  },

  updateRole: async (
    _,
    args: { id: string; input: { type: string; displayName: string; permissions?: { id: string }[] } },
    context: any,
  ) => {
    requireRole(context, ROLE.ADMIN);
    const { id, input } = args;
    try {
      const role = await RoleRepository.findOne({
        where: { id },
        relations: ["permissions"],
      });
      if (!role) {
        throw new GraphQLError(`Role with ID ${id} not found`);
      }

      role.type = input.type as any;
      role.displayName = input.displayName;

      if (input.permissions) {
        const permissionIds = input.permissions.map((p) => p.id);
        role.permissions = permissionIds.length
          ? await PermissionRepository.findBy({ id: In(permissionIds) })
          : [];
      }

      const savedRole = await RoleRepository.save(role);
      await logAudit(context, "role.update", "Role", id, {
        displayName: input.displayName,
        permissionCount: role.permissions?.length ?? 0,
      });
      return savedRole;
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      console.error("Error updating role:", error);
      throw new GraphQLError("Failed to update role");
    }
  },

  deleteRole: async (_, args: { id: string }, context: any) => {
    requireRole(context, ROLE.ADMIN);
    const { id } = args;
    try {
      const role = await RoleRepository.findOne({ where: { id } });
      if (!role) {
        throw new GraphQLError(`Role with ID ${id} not found`);
      }

      const usersWithRole = await UserRepository.count({
        where: { role: { id } },
      });
      if (usersWithRole > 0) {
        throw new GraphQLError(
          `Cannot delete this role: ${usersWithRole} user(s) still have it assigned`,
        );
      }

      await RoleRepository.remove(role);
      await logAudit(context, "role.delete", "Role", id, {
        displayName: role.displayName,
      });
      return { message: "Role deleted successfully", success: true };
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      console.error("Error deleting role:", error);
      throw new GraphQLError("Failed to delete role");
    }
  },
};
