import { reviewRepository } from "../../../config/db.connection";
import { ROLE } from "../../../enums";
import { requireRole } from "../../../util/auth";

export const reviewQueries = {
  getReviewsForBook: async (_, args: { bookId: string }) => {
    return reviewRepository.find({
      where: { book: { id: args.bookId } },
      relations: ["user", "book"],
      order: { createdAt: "DESC" },
    });
  },

  getAllReviews: async (_, __, context: any) => {
    requireRole(context, ROLE.ADMIN);
    return reviewRepository.find({
      relations: ["user", "book"],
      order: { createdAt: "DESC" },
    });
  },
};
