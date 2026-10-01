import { GraphQLError } from "graphql";
import { savedBookRepository } from "../../../config/db.connection";
import { requireAuth } from "../../../util/auth";

export const savedBookMutation = {
  saveBook: async (_, args: { bookId: string }, context: any) => {
    const user = requireAuth(context);
    const existing = await savedBookRepository.findOne({
      where: { user: { id: user.id }, book: { id: args.bookId } },
      relations: ["book"],
    });
    if (existing) return existing;

    const newSavedBook = savedBookRepository.create({
      user: { id: user.id } as any,
      book: { id: args.bookId } as any,
    });
    const saved = await savedBookRepository.save(newSavedBook);
    return savedBookRepository.findOne({
      where: { id: saved.id },
      relations: ["book"],
    });
  },

  unsaveBook: async (_, args: { bookId: string }, context: any) => {
    const user = requireAuth(context);
    const existing = await savedBookRepository.findOne({
      where: { user: { id: user.id }, book: { id: args.bookId } },
    });
    if (!existing) {
      throw new GraphQLError("This book isn't in your saved list");
    }
    await savedBookRepository.remove(existing);
    return { message: "Removed from saved books", success: true };
  },
};
