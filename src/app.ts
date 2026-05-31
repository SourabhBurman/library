import express from "express";
import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import { typeDefs } from "./graphql/typedef";
import { resolvers } from "./graphql/resolvers";
import { DBModle } from "./config/db.connection";
import { Request } from "express";
import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";
import { loginFunction } from "./graphql/resolvers/queries/user.queries";
import { signupFunction } from "./graphql/resolvers/mutations/user.mutation";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { seedBooks } from "./seed-books";
import cookieParser from "cookie-parser";

const PORT = process.env.PORT || 3000;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
});

const app = express();

(async () => {
  try {
    await DBModle.connect();
  } catch (error) {
    console.error("Error connecting to the database", error);
  }
  try {
    await server.start();
  } catch (error) {
    console.error("Error connecting to the server", error);
  }

  app.use(express.json());
  app.use(
    cors({
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.post("/signup", signupFunction);
  app.post("/login", loginFunction);
  app.post("/logout", (req, res) => {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
    });
    res.status(200).send({ message: "Logged out successfully" });
  });

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }: { req: Request }) => {
        let token = req.cookies.accessToken || "";
        let response = jwt.verify(token, process.env.JWT_SECRET);
        if (!response) {
          throw new GraphQLError("Unauthorized");
        }
        return {
          user: response,
        };
      },
    }),
  );
})();

app.listen(PORT, () =>
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`),
);
