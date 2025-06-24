import { DBModle } from "../../../config/db.connection";
import { Book } from "../../../entity/books.entity";

const bookRepository = DBModle.dbInstance.getRepository(Book);

export const bookMutation = {
  createBook: async (_: unknown, args: { input: Book }) => {
    const { name, author, description, genre } = args.input;

    try {
      const newBook = bookRepository.create({
        name,
        author,
        description,
        genre,
      });

      const savedBook = await bookRepository.save(newBook);
      return savedBook;
    } catch (error) {
      console.error("Error creating book:", error);
    }
  },
};
