import { DBModle } from "../../../config/db.connection";
import { Role } from "../../../entity/role.entity";

const RoleRepository = DBModle.dbInstance.getRepository(Role);

export const roleQueries = {
  getRoles: async () => {
    try {
      const roles = await RoleRepository.find();
      return roles;
    } catch (error) {
      console.error("Error fetching roles:", error);
      throw new Error("Failed to fetch roles");
    }
  },

  getRole: async (_, args: { id: string }) => {
    const { id } = args;
    try {
      const role = await RoleRepository.findOne({
        where: { id },
        relations: ["permissions"], // Assuming roles have permissions relation
      });
      if (!role) {
        throw new Error(`Role with ID ${id} not found`);
      }
      return role;
    } catch (error) {
      console.error("Error fetching role:", error);
      throw new Error("Failed to fetch role");
    }
  },
};
