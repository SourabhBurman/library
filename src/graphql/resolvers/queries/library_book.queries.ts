import { GraphQLError } from "graphql";
import { libraryBookRepository } from "../../../config/db.connection";

export const libraryBookQueries = {
    getBooksByLibrary: async (_, args: { id: string }) => {
        const { id } = args;
        try {
            // Returns this library's own LibraryBook rows (with their real
            // per-library totalQuantities/quantityAvailable), not the flat
            // global Book rows — a library's shelf stock is not the same
            // number as the shared catalog's unallocated stock.
            const libraryBooks = await libraryBookRepository.find({
                where: { library: { id } },
                relations: ["book", "library"],
            });
            return libraryBooks;
        } catch (error) {
            throw new GraphQLError(error.message || "Failed to fetch library book");
        }
    },
}
