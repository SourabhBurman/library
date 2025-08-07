import { GraphQLError } from "graphql";
import { DBModle } from "../../../config/db.connection";
import { User } from "../../../entity/user.entity";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import "dotenv/config";

const userRepository = DBModle.dbInstance.getRepository(User);

export const userQueries = {
  getUsers: async () => {
    try {
      const users = await userRepository.find({
        relations: ["role", "transactions"],
      });
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users");
    }
  },
  getUser: async (_, args: { id: string }) => {
    const { id } = args;
    try {
      const user = await userRepository.findOne({
        where: { id },
      });
      if (!user) {
      }
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  },
};

export const loginFunction = async (req: Request, res: Response) => {
  const { email, password: plainPassword } = req.body;
  try {
    const user = await userRepository.findOne({
      where: { email },
      relations: ["role", "transactions"],
    });
    if (!user) {
      return res.status(400).send({
        message: "User not found",
        success: false,
      });
    }
    const { password, ...rest } = user;

    let isPasswordValid = false;
    if (password && plainPassword) {
      isPasswordValid = bcrypt.compareSync(plainPassword, password);
    }
    if (!isPasswordValid) {
      return res.status(400).send({
        message: "Invalid password",
        success: false,
      });
    }

    var accessToken = jwt.sign({ ...rest }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).send({ ...user, accessToken });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(400).send({
      message: "Failed to log in " + error.message,
      success: false,
    });
  }
};
