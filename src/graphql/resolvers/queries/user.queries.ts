import { GraphQLError } from "graphql";
import { DBModle } from "../../../config/db.connection";
import { User } from "../../../entity/user.entity";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import "dotenv/config";
import { ROLE } from "../../../enums";
import { requireRole, requireSelfOrRole } from "../../../util/auth";

const userRepository = DBModle.dbInstance.getRepository(User);

export const userQueries = {
  getUsers: async (_, __, context: any) => {
    requireRole(context, ROLE.ADMIN);
    try {
      // "transactions" isn't a relation on User (it doesn't exist on the
      // entity at all — TypeORM throws on every call otherwise); orders
      // carry transactions, not users directly.
      const users = await userRepository.find({
        relations: ["role", "library_owned"],
      });
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users");
    }
  },
  getUser: async (_, args: { id?: string }, context: any) => {
    const { id } = args;

    // If no explicit ID is provided, and the user isn't logged in, they are unauthorized.
    if (!id && !context?.user?.id) {
      throw new GraphQLError("Unauthorized");
    }

    // Fetching another user's full profile (email, balance, etc.) is
    // restricted to the user themselves or an admin.
    if (id) {
      requireSelfOrRole(context, id, ROLE.ADMIN);
    }

    try {
      const user = await userRepository.findOne({
        where: { id: id ? id : context?.user?.id },
        relations: ["role", "library_owned"],
      });
      if (!user) {
      }
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  },
};

// Shared by login and /refresh: signs a fresh access token, generates and
// stores a new refresh token (rotation), and sets both cookies.
export const issueSession = async (res: Response, user: User) => {
  const { password, ...rest } = user;

  const accessToken = jwt.sign({ ...rest }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" },
  );
  const refreshTokenExpiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  );

  await userRepository.update(user.id, {
    refreshTokenHash: bcrypt.hashSync(refreshToken, 10),
    refreshTokenExpiresAt,
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return accessToken;
};

export const loginFunction = async (req: Request, res: Response) => {
  const { email, password: plainPassword } = req.body;
  // pino-http's automatic access log never sees the request body (see the
  // comment in logger.ts), so auth outcomes are logged explicitly here —
  // deliberately choosing what's safe to log (the email) and never the
  // password, rather than redacting after the fact.
  const log = (req as any).log;
  try {
    const user = await userRepository.findOne({
      where: { email },
      relations: ["role"],
    });
    if (!user) {
      log?.warn({ email }, "login failed: no account with that email");
      return res.status(400).send({
        message: "User not found",
        success: false,
      });
    }

    let isPasswordValid = false;
    if (user.password && plainPassword) {
      isPasswordValid = bcrypt.compareSync(plainPassword, user.password);
    }
    if (!isPasswordValid) {
      log?.warn({ email, userId: user.id }, "login failed: invalid password");
      return res.status(400).send({
        message: "Invalid password",
        success: false,
      });
    }

    const accessToken = await issueSession(res, user);

    log?.info({ email, userId: user.id }, "login succeeded");
    return res.status(200).send({ accessToken });
  } catch (error) {
    log?.error({ err: error, email }, "login errored");
    return res.status(400).send({
      message: "Failed to log in " + error.message,
      success: false,
    });
  }
};

// Reissues an access token (and rotates the refresh token) from a valid,
// unexpired refresh-token cookie — lets the frontend recover from an
// expired access token without forcing the user to log in again.
export const refreshFunction = async (req: Request, res: Response) => {
  const log = (req as any).log;
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).send({ message: "No refresh token", success: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET) as {
      id: string;
    };

    const user = await userRepository.findOne({
      where: { id: decoded.id },
      relations: ["role"],
    });

    if (
      !user ||
      !user.refreshTokenHash ||
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt.getTime() < Date.now() ||
      !bcrypt.compareSync(token, user.refreshTokenHash)
    ) {
      log?.warn({ userId: decoded.id }, "refresh failed: invalid or expired token");
      res.clearCookie("accessToken", { httpOnly: true, secure: true });
      res.clearCookie("refreshToken", { httpOnly: true, secure: true });
      return res
        .status(401)
        .send({ message: "Invalid or expired refresh token", success: false });
    }

    const accessToken = await issueSession(res, user);
    log?.info({ userId: user.id }, "access token refreshed");
    return res.status(200).send({ accessToken });
  } catch (error) {
    log?.warn({ err: error }, "refresh failed: token verification error");
    res.clearCookie("accessToken", { httpOnly: true, secure: true });
    res.clearCookie("refreshToken", { httpOnly: true, secure: true });
    return res
      .status(401)
      .send({ message: "Invalid or expired refresh token", success: false });
  }
};
