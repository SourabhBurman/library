import { GraphQLError } from "graphql";
import {
  bookRepository,
  DBModle,
  libraryBookRepository,
  libraryRepository,
} from "../../../config/db.connection";
import { LibraryBookInputType } from "../../interfaces/libraryBook.type";
import { LibraryBook } from "../../../entity/library_book.entity";
import { Book } from "../../../entity/books.entity";
import { Library } from "../../../entity/library.entity";
import { ROLE } from "../../../enums";
import { publishWaitlistCheck } from "../../../util/waitlist";

export const libraryBookMutation = {
  // to add book to library, only library owner is authorized to add books to library
  addBookToLibrary: async (
    _,
    { input }: { input: LibraryBookInputType },
    context: any,
  ) => {
    // Checked up front (outside the transaction below) so an unauthorized
    // caller can't even acquire the row lock further down.
    const targetLibrary = await libraryRepository.findOne({
      where: { id: input.library },
      relations: ["owner"],
    });
    if (!targetLibrary) {
      throw new GraphQLError("Library not found");
    }
    if (
      targetLibrary.owner?.id !== context.user?.id &&
      context.user?.role?.type !== ROLE.ADMIN
    ) {
      throw new GraphQLError(
        "You are not authorized to add books to this library",
      );
    }

    // added query runner to handle the transaction
    const queryRunner = DBModle.dbInstance.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // payload to update the book in libraryBook table
      let payload: Partial<LibraryBook>[] = [];

      // payload to update the book in book table
      let payloadForUpdateAllBooks: Partial<Book>[] = [];

      // find the current library
      const currentLibrary = await queryRunner.manager.findOne(Library, {
        where: {
          id: input.library,
        },
        lock: {
          mode: "pessimistic_write",
        },
      });

      // if library not found throw error
      if (!currentLibrary) {
        throw new GraphQLError("Library not found");
      }

      // find all the books in the current library
      const booksFromCurrentLibrary = await queryRunner.manager.find(
        LibraryBook,
        {
          where: {
            library: currentLibrary,
          },
        },
      );

      // find all the books
      const allBooks = await queryRunner.manager.find(Book);

      // create a map of books from current library
      const booksFromCurrentLibraryMap = new Map<string, LibraryBook>();

      // create a map of all books
      const allBooksMap = new Map<string, Book>();

      // populate the map of books from current library
      booksFromCurrentLibrary.forEach((item) => {
        booksFromCurrentLibraryMap.set(item.book.id, item);
      });

      // populate the map of all books
      allBooks.forEach((item) => {
        allBooksMap.set(item.id, item);
      });

      // if isAll is true, then add all the books to the library
      if (input.isAll) {
        allBooks.forEach((book) => {
          const existingBook = booksFromCurrentLibraryMap.get(book.id);

          // previous quanitity calculated to update new
          const previous_quantityAvailable =
            existingBook?.quantityAvailable || 0;
          const previous_totalQuantities = existingBook?.totalQuantities || 0;

          // handle case if required quantity is more than available quantity
          const possibleAvailableQuantityToBeAdded = Math.min(
            book?.quantityAvailable || 0,
            input.quantityForIsAll || 0,
          );

          // new total quanitity and available quanitity
          const totalQuantities =
            previous_totalQuantities + possibleAvailableQuantityToBeAdded;
          const quantityAvailable =
            previous_quantityAvailable + possibleAvailableQuantityToBeAdded;

          // payload to update the book in book table (subtracting the quantity added to library)
          payloadForUpdateAllBooks.push({
            id: book.id,
            quantityAvailable:
              book.quantityAvailable - possibleAvailableQuantityToBeAdded,
          });

          // new item to be added to libraryBook table
          const newItem: Partial<LibraryBook> = {
            id: existingBook?.id || undefined,
            library: currentLibrary,
            book,
            totalQuantities,
            quantityAvailable,
          };

          payload.push(newItem);
        });
      } else {
        for (const item of input.books) {
          // find the current book
          const currentBook = allBooksMap.get(item.bookId);

          // if book not found throw error
          if (!currentBook) {
            throw new GraphQLError(`Book with id ${item.bookId} not found`);
          }

          // find the existing book in the current library
          const existingBook = booksFromCurrentLibraryMap.get(currentBook.id);

          // handle case if required quantity is more than available quantity
          const possibleAvailableQuantityToBeAdded = Math.min(
            currentBook?.quantityAvailable || 0,
            item.quantity || 0,
          );

          // previous quanitity calculated to update new
          const previous_quantityAvailable =
            existingBook?.quantityAvailable || 0;
          const previous_totalQuantities = existingBook?.totalQuantities || 0;

          // new total quanitity and available quanitity
          const totalQuantities =
            previous_totalQuantities + possibleAvailableQuantityToBeAdded;
          const quantityAvailable =
            previous_quantityAvailable + possibleAvailableQuantityToBeAdded;

          // new item to be added to libraryBook table
          const newItem: Partial<LibraryBook> = {
            id: existingBook?.id || undefined,
            library: currentLibrary,
            book: currentBook,
            totalQuantities,
            quantityAvailable,
          };

          payload.push(newItem);

          // payload to update the book in book table (subtracting the quantity added to library)
          payloadForUpdateAllBooks.push({
            id: currentBook.id,
            quantityAvailable:
              currentBook.quantityAvailable -
              possibleAvailableQuantityToBeAdded,
          });
        }
      }

      // if no books to add throw error
      if (!payload.length) {
        throw new GraphQLError("No books to add");
      }

      // create new library books
      const newLibraryBooks = queryRunner.manager.create(LibraryBook, payload);

      // update the book in book table
      if (payloadForUpdateAllBooks.length) {
        await queryRunner.manager.save(Book, payloadForUpdateAllBooks);
      }

      // save the new library books
      await queryRunner.manager.save(LibraryBook, newLibraryBooks);

      // commit the transaction
      await queryRunner.commitTransaction();

      // Copies just moved into this library's stock — let anyone waiting
      // on these titles know, if they're now actually available.
      const touchedBookIds = new Set(
        payload
          .filter((item) => (item.quantityAvailable ?? 0) > 0)
          .map((item) => item.book!.id),
      );
      await Promise.all(
        Array.from(touchedBookIds).map((id) => publishWaitlistCheck(id)),
      );

      return {
        success: true,
        message: "Books added to library successfully",
      };
    } catch (error) {
      // rollback the transaction
      await queryRunner.rollbackTransaction();
      throw new GraphQLError(error.message || "Failed to add books to library");
    } finally {
      // release the query runner
      await queryRunner.release();
    }
  },

  // Updates a library's own copy count for a book it stocks (LibraryBook),
  // as distinct from updateBook, which edits the shared catalog entry.
  updateLibraryBook: async (
    _,
    { id, input }: { id: string; input: Partial<LibraryBook> },
    context: any,
  ) => {
    try {
      const libraryBook = await libraryBookRepository.findOne({
        where: { id },
        relations: ["book", "library", "library.owner"],
      });

      if (!libraryBook) {
        throw new GraphQLError("Library book not found");
      }

      if (
        libraryBook.library.owner?.id !== context.user?.id &&
        context.user?.role?.type !== ROLE.ADMIN
      ) {
        throw new GraphQLError(
          "You are not authorized to update this library's inventory",
        );
      }

      await libraryBookRepository.update(id, input);

      if ((input.quantityAvailable ?? 0) > 0) {
        await publishWaitlistCheck(libraryBook.book.id);
      }

      return await libraryBookRepository.findOne({
        where: { id },
        relations: ["book", "library"],
      });
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      throw new GraphQLError(
        error.message || "Failed to update library inventory",
      );
    }
  },
};
