import { DBModle } from "../../../config/db.connection";
import { Role } from "../../../entity/role.entity";

const RoleRepository = DBModle.dbInstance.getRepository(Role);

export const roleMutation = {
  createRole: async (_, args: { input: Role }) => {
    const { role, display_name, permissions } = args.input;

    try {
      const newRole = RoleRepository.create({
        role,
        display_name,
        permissions,
      });

      const savedRole = await RoleRepository.save(newRole);
      return savedRole;
    } catch (error) {
      console.error("Error creating role:", error);
      throw new Error("Failed to create role");
    }
  },
};
