import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
require("dotenv").config();



import { Category } from "./entities/Category";
import { Comment } from "./entities/Comment";
import { CommentVote } from "./entities/CommentVote";
import { Post } from "./entities/Post";
import { PostVote } from "./entities/PostVote";
import { User } from "./entities/User";

import path from 'path';

export default {
    migrations:{
        path: path.join(__dirname +'/migrations'), 
        pattern: /^[\w-]+\d+\.[tj]s$/, 
    },
    entities:[
        Category,
        Comment,
        CommentVote,
        Post,
        PostVote,
        User
    ],
    dbName:process.env.PG_DATABASE,
    type:'postgresql',
    debug: !__prod__,
    password: process.env.PG_PASSWORD,
    user: process.env.PG_ACCOUNT,
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    metadataProvider: TsMorphMetadataProvider,
} as Parameters<typeof MikroORM.init>[0];


