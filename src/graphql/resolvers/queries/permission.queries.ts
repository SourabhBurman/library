import { DBModle } from "../../../config/db.connection";
import { Permission } from "../../../entity/permission.entity";

const PermissionRepository = DBModle.dbInstance.getRepository(Permission);

export const permissionQueries = {
  getPermissions: async () => {
    try {
      const permissions = await PermissionRepository.find();
      return permissions;
    } catch (error) {
      throw new Error("Failed to fetch permissions");
    }
  },

  getPermission: async (_, args: { id: string }) => {
    const { id } = args;
    try {
      const permission = await PermissionRepository.findOne({
        where: { id },
      });
      if (!permission) {
        throw new Error(`Permission with ID ${id} not found`);
      }
      return permission;
    } catch (error) {
      console.error("Error fetching permission:", error);
      throw new Error("Failed to fetch permission");
    }
  },
};
