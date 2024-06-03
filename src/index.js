import { userResolvers } from "./resolvers/userResolver.js";
import { groupResolvers } from "./resolvers/groupResolver.js";

import { userTypeDefs } from "./schema/userSchema.js";
import { scalarTypeDefs } from "./schema/scalar.js";
import { messageTypeDefs } from "./schema/messageSchema.js";
import { conversationTypeDefs } from "./schema/conversationSchema.js";
import { groupTypeDefs } from "./schema/groupSchema.js";

import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import helmet from "helmet";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import { prisma } from "./connectDb/db.js";
import jwt from "jsonwebtoken";
import { messageResolvers } from "./resolvers/messageResolver.js";
import { conversationResolvers } from "./resolvers/conversationResolver.js";
import { app, httpServer } from "./socket/socket.js";

const start = async () => {
  const typeDefs = mergeTypeDefs([
    userTypeDefs,
    groupTypeDefs,
    scalarTypeDefs,
    conversationTypeDefs,
    messageTypeDefs,
  ]);

  const resolvers = mergeResolvers([
    userResolvers,
    groupResolvers,
    messageResolvers,
    conversationResolvers,
  ]);

  const PORT = process.env.PORT || 8080;
  const SECRET1 = process.env.SECRET1;

  app.use(
    helmet({
      contentSecurityPolicy: false, // disable for Apollo Sandbox
      crossOriginEmbedderPolicy: false, // disable for Apollo Sandbox
    })
  );
  app.use(bodyParser.json({ limit: "25mb" }));
  app.use(cors({ credentials: true, origin: "*" }));

  const addUser = async (req, res, next) => {
    const token = req.headers["x-token"];
    if (token) {
      try {
        const { user } = jwt.verify(token, SECRET1);
        req.user = user;
      } catch (err) {
        /* TODO: HANDLE CHECKING REEFRESH TOKEN */
        // const refreshToken = req.headers["x-refresh-token"]
        // const newTokens = await refreshTokens(token, refreshToken, mongo, SECRET1, SECRET2)
        // if (newTokens.token && newTokens.refreshToken) {
        //   res.set("Access-Control-Expose-Headers", "x-token, x-refresh-token")
        //   res.set("x-token", newTokens.token)
        //   res.set("x-refresh-token", newTokens.refreshToken)
        // }
        // req.user = newTokens.user
      }
    }

    next();
  };
  app.use(addUser);

  const apolloServer = new ApolloServer({
    resolvers,
    typeDefs,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    cors(),
    bodyParser.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const { id } = req.user || {};
        let authorizedUser = id
          ? await prisma.user.findUnique({ where: { id: String(id) } })
          : undefined;
        if (!authorizedUser || authorizedUser.inactive) {
          authorizedUser = undefined;
        }
        return { authorizedUser, SECRET1 };
      },
    })
  );

  httpServer.listen(PORT, () => {
    console.log(
      `GraphQL Server is now running on http://localhost:${PORT}/graphql`
    );
    console.log(`View GraphQL at http://localhost:${PORT}/graphql`);
  });
};

start();
