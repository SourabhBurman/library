import { GraphQLError } from "graphql";
import { DBModle } from "../../../config/db.connection";
import { Permission } from "../../../entity/permission.entity";
import { ROLE } from "../../../enums";
import { requireRole } from "../../../util/auth";

const permissionRepository = DBModle.dbInstance.getRepository(Permission);

export const permissionMutation = {
  createPermission: async (_, { input }, context: any) => {
    requireRole(context, ROLE.ADMIN);
    const { name, description } = input;
    try {
      const newPermission = permissionRepository.create({
        name,
        description,
      });

      const savedPermission = await permissionRepository.save(newPermission);
      return savedPermission;
    } catch (error) {
      throw new GraphQLError(error.message || "Failed to create permission");
    }
  },

  updatePermission: async (_, { id, input }, context: any) => {
    requireRole(context, ROLE.ADMIN);
    const { name, description } = input;
    try {
      const permissionToUpdate = await permissionRepository.findOne({
        where: { id },
      });

      if (!permissionToUpdate) {
        throw new Error(`Permission with ID ${id} not found`);
      }

      permissionToUpdate.name = name;
      permissionToUpdate.description = description;

      const updatedPermission = await permissionRepository.save(
        permissionToUpdate
      );
      return updatedPermission;
    } catch (error) {
      throw new GraphQLError(error.message || "Failed to update permission");
    }
  },

  deletePermission: async (_, { id }, context: any) => {
    requireRole(context, ROLE.ADMIN);
    try {
      const permissionToDelete = await permissionRepository.findOne({
        where: { id },
      });

      if (!permissionToDelete) {
        throw new Error(`Permission with ID ${id} not found`);
      }

      await permissionRepository.remove(permissionToDelete);
      return { message: "Permission deleted successfully" };
    } catch (error) {
      throw new GraphQLError(error.message || "Failed to delete permission");
    }
  },
};
