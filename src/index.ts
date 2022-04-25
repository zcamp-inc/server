import express from "express";
import session from "express-session";
import cors from "cors";

import connectRedis from "connect-redis";
import Redis from "ioredis";

import {MikroORM} from "@mikro-orm/core";
import microConfig from "./mikro-orm.config";

import {__prod__} from "./constants";

import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/user";
import { PostResolver } from "./resolvers/post";


require("dotenv").config();

console.log(process.env.NODE_ENV);



declare module 'express-session' {
    export interface SessionData {
      loadedCount: number;
      userid: number ;
    }
  }``


const main = async() => {

    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();

    const app = express();
    app.set("trust proxy", 1);
    app.use( cors());

    const redis = new Redis({
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
    });

    const RedisStore = connectRedis(session);
    const redisStore = new RedisStore({
        client: redis,
    });

    app.use(
        session({
            store: redisStore,
            name: process.env.COOKIE_NAME,
            sameSite: "Strict",
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                path:"/",
                httpOnly: true,
                secure: false,
                maxAge: 1000 * 60 * 60 * 1024,
            },
        } as any)
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
          resolvers: [ UserResolver, PostResolver],
          validate: false,
        }),
        context: ({ req, res }) => ({
          req,
          res,
          redis,
          em : orm.em,
        }),
      });

      await apolloServer.start();
    
      apolloServer.applyMiddleware({
        app,
        cors: false,
      });
    
      app.listen({port: process.env.SERVER_PORT}, () => {
        console.log(`Server ready on port ${process.env.SERVER_PORT}`);
      });
}

main().catch((err) => console.error(err));
