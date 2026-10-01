import { GraphQLError } from "graphql";
import { DBModle } from "../../../config/db.connection";
import { reviewRepository } from "../../../config/db.connection";
import { Order } from "../../../entity/order.entity";
import { Review } from "../../../entity/review.entity";
import { ORDER_STATUS_ENUM, ROLE } from "../../../enums";
import { requireAuth } from "../../../util/auth";

export const reviewMutation = {
  createReview: async (
    _,
    { input }: { input: { bookId: string; rating: number; comment?: string } },
    context: any,
  ) => {
    const user = requireAuth(context);
    const { bookId, rating, comment } = input;

    if (rating < 1 || rating > 5) {
      throw new GraphQLError("Rating must be between 1 and 5");
    }

    // Only someone who has actually purchased or returned this book may
    // review it — borrowing-in-progress doesn't count.
    const eligibleOrder = await DBModle.dbInstance.manager.findOne(Order, {
      where: [
        {
          user: { id: user.id },
          libraryBook: { book: { id: bookId } },
          current_status: ORDER_STATUS_ENUM.PURCHASED,
        },
        {
          user: { id: user.id },
          libraryBook: { book: { id: bookId } },
          current_status: ORDER_STATUS_ENUM.RETURNED,
        },
      ],
    });

    if (!eligibleOrder) {
      throw new GraphQLError(
        "You can only review books you've borrowed or purchased",
      );
    }

    const existing = await reviewRepository.findOne({
      where: { user: { id: user.id }, book: { id: bookId } },
    });

    let savedId: string;
    if (existing) {
      existing.rating = rating;
      existing.comment = comment ?? existing.comment;
      savedId = (await reviewRepository.save(existing)).id;
    } else {
      const newReview = reviewRepository.create({
        rating,
        comment,
        user: { id: user.id } as any,
        book: { id: bookId } as any,
      });
      savedId = (await reviewRepository.save(newReview)).id;
    }

    // The just-saved entity only carries partial `{ id }` relations — reload
    // with the full relations so `user`/`book` sub-fields resolve correctly.
    return reviewRepository.findOne({
      where: { id: savedId },
      relations: ["user", "book"],
    });
  },

  deleteReview: async (_, args: { id: string }, context: any) => {
    const user = requireAuth(context);
    const review = await reviewRepository.findOne({
      where: { id: args.id },
      relations: ["user"],
    });
    if (!review) {
      throw new GraphQLError("Review not found");
    }
    if (review.user.id !== user.id && user.role?.type !== ROLE.ADMIN) {
      throw new GraphQLError("You are not authorized to delete this review");
    }
    await reviewRepository.remove(review);
    return { message: "Review deleted successfully", success: true };
  },
};
