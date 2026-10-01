import { GraphQLError } from "graphql";
import { MoreThan } from "typeorm";
import {
  waitlistRepository,
  libraryBookRepository,
} from "../../../config/db.connection";
import { requireAuth } from "../../../util/auth";

export const waitlistMutation = {
  joinWaitlist: async (_, args: { bookId: string }, context: any) => {
    const user = requireAuth(context);

    const hasStock = await libraryBookRepository.exist({
      where: { book: { id: args.bookId }, quantityAvailable: MoreThan(0) },
    });
    if (hasStock) {
      throw new GraphQLError(
        "This book already has copies available — no need to join the waitlist",
      );
    }

    const existing = await waitlistRepository.findOne({
      where: { user: { id: user.id }, book: { id: args.bookId } },
      relations: ["book"],
    });
    if (existing) return existing;

    const newEntry = waitlistRepository.create({
      user: { id: user.id } as any,
      book: { id: args.bookId } as any,
    });
    const saved = await waitlistRepository.save(newEntry);
    return waitlistRepository.findOne({
      where: { id: saved.id },
      relations: ["book"],
    });
  },

  leaveWaitlist: async (_, args: { bookId: string }, context: any) => {
    const user = requireAuth(context);
    const existing = await waitlistRepository.findOne({
      where: { user: { id: user.id }, book: { id: args.bookId } },
    });
    if (!existing) {
      throw new GraphQLError("You're not on the waitlist for this book");
    }
    await waitlistRepository.remove(existing);
    return { message: "Removed from waitlist", success: true };
  },
};
