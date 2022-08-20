
import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core';
import { Request, Response } from 'express';
import { Redis } from "ioredis";
import { ObjectType, Field } from 'type-graphql';
import { User } from './entities/User';
import { Post } from './entities/Post';
import { Group } from './entities/Group';
import { University } from './entities/University';
import { Comment } from './entities/Comment';

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

@ObjectType()
export class UniversityResponse{
    @Field(()=> [FieldError], {nullable: true})
    errors?: FieldError[];
    @Field(()=>University, {nullable: true})
    university?: University;
}
@ObjectType()
export class GroupResponse{
    @Field(()=> [FieldError], {nullable: true})
    errors?: FieldError[];
    @Field(()=>Group, {nullable: true})
    group?: Group;
}

@ObjectType()
export class CommentResponse{
    @Field(()=> [FieldError], {nullable: true})
    errors?: FieldError[];
    @Field(()=>Comment, {nullable: true})
    comment?: Comment;
}

@ObjectType()
export class CommentsResponse{
    @Field(()=> [FieldError], {nullable: true})
    errors?: FieldError[];
    @Field(()=>Comment, {nullable: true})
    comments?: Comment[];
}

@ObjectType()
export class PaginatedPosts {
  @Field(() => [Post], {nullable: true})
  posts?: Post[];
  @Field()
  hasMore: boolean;
  @Field()
  cursor: number;
}

//   req: Request & { session: Express.Session };
