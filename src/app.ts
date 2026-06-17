import express from "express";
import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import { typeDefs } from "./graphql/typedef";
import { resolvers } from "./graphql/resolvers";
import { DBModle } from "./config/db.connection";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";
import { loginFunction } from "./graphql/resolvers/queries/user.queries";
import { signupFunction } from "./graphql/resolvers/mutations/user.mutation";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import cookieParser from "cookie-parser";
import { razorpayWebhookFunction } from "./controllers/razorpayWebhook";
import { startCronJobs } from "./jobs/cronJobs";

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
    startCronJobs();
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
      origin: "http://localhost:3000",
    }),
  );
  app.use(cookieParser());
  
  app.post("/webhooks/razorpay", razorpayWebhookFunction);
  app.post("/signup", signupFunction);
  app.post("/login", loginFunction);
  app.post("/logout", (_, res) => {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
    });
    res.status(200).send({ message: "Logged out successfully" });
  });

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }: { req: Request; res: Response }) => {
        if (
          req.body?.query?.includes("__schema") ||
          req.body?.operationName === "IntrospectionQuery"
        ) {
          return {};
        }
        let token = req.cookies.accessToken || "";
        if (!token) {
          throw new GraphQLError("Unauthorized", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }
        try {
          let response = jwt.verify(token, process.env.JWT_SECRET as string);
          return {
            user: response,
          };
        } catch (error) {
          res.clearCookie("accessToken", {
            httpOnly: true,
            secure: true,
          });
          throw new GraphQLError("Unauthorized: Token expired or invalid", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }
      },
    }),
  );
})();

app.listen(PORT, () =>
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`),
);
