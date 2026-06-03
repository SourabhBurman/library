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

export const userMutation = {
  updateUser: async (_, args: { id: string; input: User }) => {
    const { id, input } = args;
    try {
      await userRepository.update(id, input);
      const user = await userRepository.findOne({
        where: { id },
        relations: ["role"],
      });
      if (!user) {
        throw new GraphQLError(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new GraphQLError("Failed to update user", error);
    }
  },

  deleteUser: async (_, args: { id: string }) => {
    const { id } = args;
    try {
      const userToDelete = await userRepository.findOne({
        where: { id },
      });

      if (!userToDelete) {
        throw new GraphQLError(`User with ID ${id} not found`);
      }

      await userRepository.remove(userToDelete);
      return { message: "User deleted successfully", success: true };
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new GraphQLError("Failed to delete user");
    }
  },
};

export const signupFunction = async (req: Request, res: Response) => {
  const { name, gender, email, password, role } = req.body;
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
    return res.status(200).send(returnedUser);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).send({
        success: false,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "User with this email already exists",
        },
      });
    }
    res.status(400).send({
      message: error?.message ?? "Failed to create user",
      success: false,
    });
  }
};
