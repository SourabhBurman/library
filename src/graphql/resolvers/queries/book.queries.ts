import { DBModle } from "../../../config/db.connection";
import { Book } from "../../../entity/books.entity";

const bookRepository = DBModle.dbInstance.getRepository(Book);

export const bookQueries = {
  booksListing: async (_parent: any, _args: any) => {
    try {
      const books = await bookRepository.find();
      return books;
    } catch (error) {
      console.error("Error fetching books:", error);
      throw new Error("Failed to fetch books");
    }
  },
};
