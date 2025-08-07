import { GraphQLError } from "graphql";
import { DBModle } from "../../../config/db.connection";
import { User } from "../../../entity/user.entity";
import bcrypt from "bcrypt";
import { Request, Response } from "express";

const userRepository = DBModle.dbInstance.getRepository(User);

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
  const { name, gender, email, password } = req.body;

  try {
    const hash = bcrypt.hashSync(password, 10);
    const newUser = userRepository.create({
      name,
      gender,
      email,
      password: hash,
    });

    const savedUser = await userRepository.save(newUser);
    const returnedUser = await userRepository.findOne({
      where: { id: savedUser.id },
      relations: ["role", "books"],
    });
    return res.status(200).send(returnedUser);
  } catch (error) {
    console.error("Error creating reader:", error);
    res.status(400).send({
      message: "Failed to create user",
      success: false,
    });
  }
};
