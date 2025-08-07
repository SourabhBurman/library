import { GraphQLError } from "graphql";
import { DBModle } from "../../../config/db.connection";
import { Book } from "../../../entity/books.entity";
import { BookFilterInput } from "../../interfaces/book.type";
import { PaginationInput } from "../../interfaces/shared";
import { setPaginationFilters } from "../../../util/functions";

const bookRepository = DBModle.dbInstance.getRepository(Book);

export const bookQueries = {
  getBooks: async (
    _,
    args: { pagination: PaginationInput; filter: BookFilterInput }
  ) => {
    const { pagination, filter } = args;
    try {
      const books = bookRepository.createQueryBuilder();

      const paginatedBooks = await setPaginationFilters(
        books,
        pagination,
        filter
      ).getMany();
      return paginatedBooks;
    } catch (error) {
      console.error("Error fetching books:", error);
      throw new GraphQLError("Failed to fetch books");
    }
  },

  getBook: async (_, args: { id: string }) => {
    const { id } = args;
    try {
      const book = await bookRepository.findOne({
        where: { id },
      });
      if (!book) {
        throw new Error(`Book with ID ${id} not found`);
      }
      return book;
    } catch (error) {
      console.error("Error fetching book:", error);
      throw new Error("Failed to fetch book");
    }
  },
};
