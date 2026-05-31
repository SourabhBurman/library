import { GraphQLError } from "graphql";
import { libraryRepository } from "../../../config/db.connection";

export const libraryQueries = {
    getLibraries: async () => {
        try {
            const libraries = await libraryRepository.find();
            return libraries;
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