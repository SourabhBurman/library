import { GraphQLError } from "graphql";
import { bookRepository, DBModle, libraryBookRepository, libraryRepository } from "../../../config/db.connection";
import { LibraryBookInputType } from "../../interfaces/libraryBook.type";
import { LibraryBook } from "../../../entity/library_book.entity";
import { Book } from "../../../entity/books.entity";
import { Library } from "../../../entity/library.entity";

export const libraryBookMutation = {
    // to add book to library, only library owner is authorized to add books to library
    addBookToLibrary: async (_, { input }: { input: LibraryBookInputType }) => {


        // added query runner to handle the transaction
        const queryRunner = DBModle.dbInstance.createQueryRunner();
        await queryRunner.startTransaction();

        try {
            // payload to update the book in library_book table
            let payload: Partial<LibraryBook>[] = [];

            // payload to update the book in book table
            let payloadForUpdateAllBooks: Partial<Book>[] = [];

            // find the current library
            const currentLibrary = await queryRunner.manager.findOne(Library, {
                where: {
                    id: input.library,
                },
                lock: {
                    mode: "pessimistic_write"
                }
            });

            // if library not found throw error
            if (!currentLibrary) {
                throw new GraphQLError("Library not found");
            }

            // find all the books in the current library
            const booksFromCurrentLibrary = await queryRunner.manager.find(LibraryBook, {
                where: {
                    library: currentLibrary,
                },
            });

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
                    const previous_quantity_available = existingBook?.quantity_available || 0;
                    const previous_total_quantities = existingBook?.total_quantities || 0;

                    // handle case if required quantity is more than available quantity
                    const possibleAvailableQuantityToBeAdded = Math.min(book?.quantity_available || 0, input.quantityForIsAll || 0);

                    // new total quanitity and available quanitity
                    const total_quantities = previous_total_quantities + possibleAvailableQuantityToBeAdded;
                    const quantity_available = previous_quantity_available + possibleAvailableQuantityToBeAdded;

                    // payload to update the book in book table (subtracting the quantity added to library)
                    payloadForUpdateAllBooks.push({
                        id: book.id,
                        quantity_available: book.quantity_available - possibleAvailableQuantityToBeAdded,
                    });

                    // new item to be added to library_book table
                    const newItem: Partial<LibraryBook> = {
                        id: existingBook?.id || undefined,
                        library: currentLibrary,
                        book,
                        total_quantities,
                        quantity_available,
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
                    const possibleAvailableQuantityToBeAdded = Math.min(currentBook?.quantity_available || 0, item.quantity || 0);
                    
                    // previous quanitity calculated to update new
                    const previous_quantity_available = existingBook?.quantity_available || 0;
                    const previous_total_quantities = existingBook?.total_quantities || 0;

                    // new total quanitity and available quanitity
                    const total_quantities = previous_total_quantities + possibleAvailableQuantityToBeAdded;
                    const quantity_available = previous_quantity_available + possibleAvailableQuantityToBeAdded;

                    // new item to be added to library_book table
                    const newItem: Partial<LibraryBook> = {
                        id: existingBook?.id || undefined,
                        library: currentLibrary,
                        book: currentBook,
                        total_quantities,
                        quantity_available,
                    };

                    payload.push(newItem);

                    // payload to update the book in book table (subtracting the quantity added to library)
                    payloadForUpdateAllBooks.push({
                        id: currentBook.id,
                        quantity_available: currentBook.quantity_available - possibleAvailableQuantityToBeAdded,
                    });
                }
            }

            // if no books to add throw error
            if(!payload.length){
                throw new GraphQLError("No books to add");
            }

            // create new library books
            const newLibraryBooks = queryRunner.manager.create(LibraryBook, payload);
            
            // update the book in book table
            if(payloadForUpdateAllBooks.length){
                await queryRunner.manager.save(Book, payloadForUpdateAllBooks);
            }
            
            // save the new library books
             await queryRunner.manager.save(LibraryBook, newLibraryBooks);
            
            // commit the transaction
            await queryRunner.commitTransaction();
            return {
                success: true,
                message: "Books added to library successfully",
            };
        } catch (error) {
            // rollback the transaction
            await queryRunner.rollbackTransaction();
            throw new GraphQLError( error.message || "Failed to add books to library");
        } finally {
            // release the query runner
            await queryRunner.release();
        }
    },
}