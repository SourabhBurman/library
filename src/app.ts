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
const PORT = process.env.PORT || 3000;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const app = express();
app.use(express.json());

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
  app.use(cors());
  app.post("/signup", signupFunction);
  app.post("/login", loginFunction);

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }: { req: Request }) => {
        let token = req.headers?.authorization || "";
        let response = jwt.verify(token, process.env.JWT_SECRET);
        if (!response) {
          throw new GraphQLError("Unauthorized");
        }
        return {
          user: response,
        };
      },
    })
  );
})();

app.listen(PORT, () =>
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)
);
