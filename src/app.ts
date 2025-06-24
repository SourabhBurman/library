import express from "express";
import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import { typeDefs } from "./graphql/typedef";
import { resolvers } from "./graphql/resolvers";
import { DBModle } from "./config/db.connection";

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
  app.use("/graphql", cors(), express.json(), expressMiddleware(server));
})();

app.listen(PORT, () =>
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)
);
