import { DBModle } from "../../../config/db.connection";
import { Permission } from "../../../entity/permission.entity";

const permissionRepository = DBModle.dbInstance.getRepository(Permission);

export const permissionMutation = {
  createPermission: async (_, { input }) => {
    const { name, description } = input;
    try {
      const newPermission = permissionRepository.create({
        name,
        description,
      });

      const savedPermission = await permissionRepository.save(newPermission);
      return savedPermission;
    } catch (error) {
      throw new Error("Failed to create permission");
    }
  },

  updatePermission: async (_, { id, input }) => {
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
      console.error("Error updating permission:", error);
      throw new Error("Failed to update permission");
    }
  },

  deletePermission: async (_, { id }) => {
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
      console.error("Error deleting permission:", error);
      throw new Error("Failed to delete permission");
    }
  },
};
