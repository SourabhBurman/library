import { GraphQLError } from "graphql";
import { DBModle } from "../../../config/db.connection";
import { Book } from "../../../entity/books.entity";
import { BookFilterInput } from "../../interfaces/book.type";
import { PaginationInput } from "../../interfaces/shared";
import { setPaginationFilters } from "../../../util/functions";
import { getOrSetCache } from "../../../util/cache";

const bookRepository = DBModle.dbInstance.getRepository(Book);

export const bookQueries = {
  getBooks: async (
    _,
    args: { pagination: PaginationInput; filter: BookFilterInput }
  ) => {
    const { pagination, filter } = args;
    try {
      // Public, read-heavy, and changes only when an Admin/Owner edits the
      // catalog — a good candidate for a short cache. The key has to
      // encode every argument that changes the result (page, filters) —
      // otherwise page 2 would wrongly serve page 1's cached rows.
      const cacheKey = `books:${JSON.stringify({ pagination, filter })}`;
      return await getOrSetCache(cacheKey, 60, async () => {
        const books = bookRepository.createQueryBuilder();
        return setPaginationFilters(books, pagination, filter).getMany();
      });
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
