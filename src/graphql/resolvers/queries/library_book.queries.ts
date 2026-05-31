import { GraphQLError } from "graphql";
import { libraryBookRepository } from "../../../config/db.connection";

export const libraryBookQueries = {
    getBooksByLibrary: async (_, args: { id: string }) => {
        const { id } = args;
        try {
            const libraryBook = await libraryBookRepository.find({
                where: { library: { id } },
                relations: ["book"],
            });
            if (!libraryBook) {
                throw new Error(`Library book with ID ${id} not found`);
            }
            return libraryBook?.flat(0)?.map((item) => item.book);
        } catch (error) {
            throw new GraphQLError(error.message || "Failed to fetch library book");
        }
    },
}