import { GraphQLError } from "graphql";
import { libraryRepository } from "../../../config/db.connection";
import { getOrSetCache } from "../../../util/cache";

export const libraryQueries = {
    getLibraries: async () => {
        try {
            // No arguments -> one fixed cache key. Libraries are created/edited
            // far less often than they're read (every dashboard page shows them).
            return await getOrSetCache("libraries:all", 60, () => libraryRepository.find());
        } catch (error) {
            throw new GraphQLError(error.message || "Failed to fetch libraries");
        }
    },

    getLibraryById: async (_, args: { id: string }) => {
        const { id } = args;
        try {
            const library = await libraryRepository.findOne({
                where: { id },
            });
            if (!library) {
                throw new GraphQLError(`Library with ID ${id} not found`);
            }
            return library;
        } catch (error) {
            throw new GraphQLError(error.message || "Failed to fetch library");
        }
    },
}