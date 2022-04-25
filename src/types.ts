
import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core';
import { Request, Response } from 'express';
import { Redis } from "ioredis";
import { ObjectType, Field } from 'type-graphql';
import { User } from './entities/User';
import { Post } from './entities/Post';

export type MyContext = {
  req:  Request ;
  res: Response;
  redis: Redis;
  em: EntityManager<IDatabaseDriver<Connection>>;
}

@ObjectType()
export class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
export class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => User, { nullable: true })
  user?: User;
}

@ObjectType()
export class PostResponse{
    @Field(()=> [FieldError], {nullable: true})
    errors?: FieldError[];
    @Field(()=>Post, {nullable: true})
    post?: Post;
}


//   req: Request & { session: Express.Session };
