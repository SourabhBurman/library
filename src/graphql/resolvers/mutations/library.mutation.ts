import { GraphQLError } from "graphql";
import { libraryRepository } from "../../../config/db.connection";
import { Library } from "../../../entity/library.entity";
import { ROLE } from "../../../enums";
import { requireRole } from "../../../util/auth";
import { logAudit } from "../../../util/auditLog";
import { invalidateCache } from "../../../util/cache";

export const libraryMutation = {
    // to create a new library, only library owner is authorized to create library
    createLibrary: async (_, { input }: { input: Library }, context: any) => {
        const user = requireRole(context, ROLE.LIBRARY_OWNER);
        const { name, address } = input;
        try {
            const existing = await libraryRepository.findOne({
                where: { owner: { id: user.id } },
            });
            if (existing) {
                throw new GraphQLError("You already own a library");
            }

            const newLibrary = libraryRepository.create({
                name,
                address,
                owner: { id: user.id },
            });
            const savedLibrary = await libraryRepository.save(newLibrary);
            await invalidateCache("libraries:");
            return savedLibrary;
        } catch (error) {
            if (error instanceof GraphQLError) throw error;
            throw new GraphQLError(error.message || "Failed to create library");
        }
    },

    // to delete a library, only that library's owner and admin is authorized to delete it
    deleteLibrary: async (_, args: { id: string }, context: any) => {
        const { id } = args;
        try {
            const libraryToDelete = await libraryRepository.findOne({
                where: { id },
                relations: ["owner"],
            });
            if (!libraryToDelete) {
                throw new GraphQLError(`Library with ID ${id} not found`);
            }
            if (
                libraryToDelete.owner?.id !== context.user?.id &&
                context.user?.role?.type !== ROLE.ADMIN
            ) {
                throw new GraphQLError(
                    "You are not authorized to delete this library",
                );
            }
            // Snapshot the fields before removing: TypeORM clears the
            // primary key off the in-memory entity once it's removed, so
            // returning it afterwards would hand back a null id.
            const removed = { ...libraryToDelete };
            await libraryRepository.remove(libraryToDelete);
            if (context.user?.role?.type === ROLE.ADMIN) {
                await logAudit(context, "library.delete", "Library", id, {
                    name: removed.name,
                });
            }
            await invalidateCache("libraries:");
            return removed;
        } catch (error) {
            if (error instanceof GraphQLError) throw error;
            throw new GraphQLError(error.message || "Failed to delete library");
        }
    },

    // to update a library, only that library's owner and admin is authorized to update it
    updateLibrary: async (
        _,
        args: { id: string; input: Library },
        context: any,
    ) => {
        const { id, input } = args;
        try {
            const libraryToUpdate = await libraryRepository.findOne({
                where: { id },
                relations: ["owner"],
            });
            if (!libraryToUpdate) {
                throw new GraphQLError(`Library with ID ${id} not found`);
            }
            if (
                libraryToUpdate.owner?.id !== context.user?.id &&
                context.user?.role?.type !== ROLE.ADMIN
            ) {
                throw new GraphQLError(
                    "You are not authorized to update this library",
                );
            }
            await libraryRepository.update(id, input);
            if (context.user?.role?.type === ROLE.ADMIN) {
                await logAudit(context, "library.update", "Library", id, {
                    fields: Object.keys(input),
                });
            }
            await invalidateCache("libraries:");
            return await libraryRepository.findOne({ where: { id } });
        } catch (error) {
            if (error instanceof GraphQLError) throw error;
            throw new GraphQLError(error.message || "Failed to update library");
        }
    },
}
