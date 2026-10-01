import { bookRepository, DBModle } from "../../../config/db.connection";
import { Book } from "../../../entity/books.entity";
import { ROLE } from "../../../enums";
import { requireRole } from "../../../util/auth";
import { logAudit } from "../../../util/auditLog";
import { invalidateCache } from "../../../util/cache";

export const bookMutation = {
  // The shared catalog itself (creating/removing titles platform-wide) is
  // admin-managed; owners only manage their own library's copy of a title
  // (see updateLibraryBook) plus its shared price/details via updateBook.
  createBook: async (_, args: { input: Book }, context: any) => {
    requireRole(context, ROLE.ADMIN);
    try {
      const newBook = bookRepository.create({
        ...args.input,
        publishedDate: args.input.publishedDate
          ? new Date(args.input.publishedDate)
          : new Date(),
      });

      const savedBook = await bookRepository.save(newBook);
      await logAudit(context, "book.create", "Book", String(savedBook.id), {
        name: savedBook.name,
      });
      await invalidateCache("books:");
      return savedBook;
    } catch (error) {
      console.error("Error creating book:", error);
      throw error;
    }
  },

  updateBook: async (
    _,
    args: { id: string; input: Partial<Book> },
    context: any,
  ) => {
    const { id, input } = args;
    requireRole(context, ROLE.LIBRARY_OWNER, ROLE.ADMIN);

    try {
      await bookRepository.update(id, input);
      const updatedBook = await bookRepository.findOne({ where: { id } });

      if (!updatedBook) {
        throw new Error(`Book with ID ${id} not found`);
      }

      if (context.user?.role?.type === ROLE.ADMIN) {
        await logAudit(context, "book.update", "Book", id, {
          fields: Object.keys(input),
        });
      }

      await invalidateCache("books:");
      return updatedBook;
    } catch (error) {
      console.error("Error updating book:", error);
      throw new Error("Failed to update book");
    }
  },

  deleteBook: async (_, args: { id: string }, context: any) => {
    const { id } = args;
    requireRole(context, ROLE.ADMIN);
    try {
      const bookToDelete = await bookRepository.findOne({
        where: { id },
      });

      if (!bookToDelete) {
        throw new Error(`Book with ID ${id} not found`);
      }

      await bookRepository.remove(bookToDelete);
      await logAudit(context, "book.delete", "Book", id, {
        name: bookToDelete.name,
      });
      await invalidateCache("books:");
      return { message: "Book deleted successfully", success: true };
    } catch (error) {
      console.error("Error deleting book:", error);
      throw new Error("Failed to delete book");
    }
  },
};
