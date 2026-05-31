import { GraphQLError } from "graphql";
import { libraryRepository } from "../../../config/db.connection";
import { Library } from "../../../entity/library.entity";

export const libraryMutation = {
    // to create a new library, only library owner is authorized to create library
    createLibrary: async (_, { input }: { input: Library }, context: any) => {
        const { name, address } = input;
        try {
            const newLibrary = libraryRepository.create({
                name,
                address,
                owner: context.user?.id,
            });
            const savedLibrary = await libraryRepository.save(newLibrary);
            return savedLibrary;
        } catch (error) {
            throw new GraphQLError(error.message || "Failed to create library");
        }
    },

    // to delete a library, only library owner and admin is authorized to delete library
    deleteLibrary: async (_, args: { id: string }) => {
        const { id } = args;
        try {
            const libraryToDelete = await libraryRepository.findOne({
                where: { id },
            });
            if (!libraryToDelete) {
                throw new GraphQLError(`Library with ID ${id} not found`);
            }
            await libraryRepository.remove(libraryToDelete);
            return { message: "Library deleted successfully", success: true };
        } catch (error) {
            throw new GraphQLError(error.message || "Failed to delete library");
        }
    },

    // to update a library, only library owner is authorized to update library
    updateLibrary: async (_, args: { id: string; input: Library }) => {
        const { id, input } = args;
        try {
            const libraryToUpdate = await libraryRepository.findOne({
                where: { id },
            });
            if (!libraryToUpdate) {
                throw new GraphQLError(`Library with ID ${id} not found`);
            }
            await libraryRepository.update(id, input);
            return { message: "Library updated successfully", success: true };
        } catch (error) {
            throw new GraphQLError(error.message || "Failed to update library");
        }
    },
}