import { bookRepository, DBModle } from "../../../config/db.connection";
import { Book } from "../../../entity/books.entity";


export const bookMutation = {
  createBook: async (_, args: { input: Book }) => {
    try {
      const newBook = bookRepository.create({
        ...args.input,
        published_date: new Date(),
      });

      const savedBook = await bookRepository.save(newBook);
      return savedBook;
    } catch (error) {
      console.error("Error creating book:", error);
    }
  },

  updateBook: async (_, args: { id: string; input: Partial<Book> }) => {
    const { id, input } = args;

    try {
      await bookRepository.update(id, input);
      const updatedBook = await bookRepository.findOne({ where: { id } });

      if (!updatedBook) {
        throw new Error(`Book with ID ${id} not found`);
      }

      return updatedBook;
    } catch (error) {
      console.error("Error updating book:", error);
      throw new Error("Failed to update book");
    }
  },

  deleteBook: async (_, args: { id: string }) => {
    const { id } = args;
    try {
      const bookToDelete = await bookRepository.findOne({
        where: { id },
      });

      if (!bookToDelete) {
        throw new Error(`Book with ID ${id} not found`);
      }

      await bookRepository.remove(bookToDelete);
      return { message: "Book deleted successfully", success: true };
    } catch (error) {
      console.error("Error deleting book:", error);
      throw new Error("Failed to delete book");
    }
  },
};
