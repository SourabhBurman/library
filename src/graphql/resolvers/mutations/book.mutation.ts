import { DBModle } from "../../../config/db.connection";
import { Book } from "../../../entity/books.entity";

const bookRepository = DBModle.dbInstance.getRepository(Book);

export const bookMutation = {
  createBook: async (_, args: { input: Book }) => {
    const { totalQuantities } = args.input;

    try {
      const newBook = bookRepository.create({
        ...args.input,
        quantityAvailable: totalQuantities,
        publishedDate: new Date(),
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
};
