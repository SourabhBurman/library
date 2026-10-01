import { savedBookRepository } from "../../../config/db.connection";
import { requireAuth } from "../../../util/auth";

export const savedBookQueries = {
  getSavedBooks: async (_, __, context: any) => {
    const user = requireAuth(context);
    return savedBookRepository.find({
      where: { user: { id: user.id } },
      relations: ["book"],
      order: { createdAt: "DESC" },
    });
  },
};
