import { GraphQLError } from "graphql";
import {
  DBModle,
  roleRepository,
  userRepository,
} from "../../../config/db.connection";
import { User } from "../../../entity/user.entity";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { ROLE } from "../../../enums";
import { requireRole, requireSelfOrRole } from "../../../util/auth";
import { logAudit } from "../../../util/auditLog";

export const userMutation = {
  updateUser: async (
    _,
    args: { id: string; input: Partial<User> },
    context: any,
  ) => {
    const { id, input } = args;
    requireSelfOrRole(context, id, ROLE.ADMIN);
    try {
      // updateUser previously wrote a new password straight through, so
      // changing it here stored it in plain text (signup, by contrast,
      // hashes it correctly) — hash it the same way here if present.
      const finalInput = { ...input };
      if (finalInput.password) {
        finalInput.password = bcrypt.hashSync(finalInput.password, 10);
      }

      await userRepository.update(id, finalInput);
      const user = await userRepository.findOne({
        where: { id },
        relations: ["role"],
      });
      if (!user) {
        throw new GraphQLError(`User with ID ${id} not found`);
      }

      // Only log this as an admin action when an Admin is editing someone
      // else's account — a Reader/Owner updating their own profile isn't
      // an "admin action" worth auditing.
      if (
        context.user?.role?.type === ROLE.ADMIN &&
        String(context.user?.id) !== String(id)
      ) {
        await logAudit(context, "user.update", "User", id, {
          fields: Object.keys(input),
        });
      }

      return user;
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      console.error("Error updating user:", error);
      throw new GraphQLError("Failed to update user", error);
    }
  },

  deleteUser: async (_, args: { id: string }, context: any) => {
    const { id } = args;
    requireRole(context, ROLE.ADMIN);
    if (String(context.user?.id) === String(id)) {
      throw new GraphQLError("You cannot delete your own account");
    }
    try {
      const userToDelete = await userRepository.findOne({
        where: { id },
      });

      if (!userToDelete) {
        throw new GraphQLError(`User with ID ${id} not found`);
      }

      await userRepository.remove(userToDelete);
      await logAudit(context, "user.delete", "User", id, {
        email: userToDelete.email,
      });
      return { message: "User deleted successfully", success: true };
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      console.error("Error deleting user:", error);
      throw new GraphQLError("Failed to delete user");
    }
  },
};

export const signupFunction = async (req: Request, res: Response) => {
  const { name, gender, email, password, role } = req.body;
  const log = (req as any).log;
  try {
    const hash = bcrypt.hashSync(password, 10);
    const roleEntity = await roleRepository.findOne({ where: { type: role } });
    const newUser = userRepository.create({
      name,
      gender,
      email,
      password: hash,
      role: roleEntity,
    });

    const savedUser = await userRepository.save(newUser);
    const returnedUser = await userRepository.findOne({
      where: { id: savedUser.id },
      relations: ["role"],
    });
    log?.info({ email, userId: savedUser.id, role }, "signup succeeded");
    return res.status(200).send(returnedUser);
  } catch (error) {
    if (error.code === "23505") {
      log?.warn({ email }, "signup failed: email already exists");
      return res.status(400).send({
        success: false,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "User with this email already exists",
        },
      });
    }
    log?.error({ err: error, email }, "signup errored");
    res.status(400).send({
      message: error?.message ?? "Failed to create user",
      success: false,
    });
  }
};
