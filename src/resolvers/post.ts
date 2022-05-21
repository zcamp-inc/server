
import {
    Resolver,
    Mutation,
    Arg,
    Ctx,
    Query,
    FieldResolver,
    Root,
    UseMiddleware,
    Int,
  } from "type-graphql";

import { MyContext } from "../types";
import { Post } from "../entities/Post";
import { isAuth } from "../middleware/isAuth";
import { User } from "../entities/User";
import { PostVote } from "../entities/PostVote";
import { UserResponse, PostResponse, PaginatedPosts } from "../types";
import { Group } from "../entities/Group";
import { QueryOrder } from "@mikro-orm/core";

@Resolver(Post)
export class PostResolver {

  @FieldResolver(() => Int)
  voteCount(@Root() post:Post){
    return post.votes.count();
  }

  @FieldResolver(() => String)
  bodySnippet(@Root() post:Post){
    return post.body.slice(0,100);
  }

  @FieldResolver(() => User)
  async creator(
    @Root() post:Post, 
    @Ctx() {em} : MyContext
  ): Promise<UserResponse>{
    const user =  await em.findOne(User, {id: post.owner.id});
    if (user){
      return {user,};
    }else{
      return {
        errors: [{
          field: "User not found.",
          message: "User could not be fetched."
        }]
      }
    }
  }

  @Query(() => Post, { nullable: true })
  async get(
    @Arg("id") id: number,
    @Ctx() {em}: MyContext
): Promise<PostResponse> {
    const post = await em.findOne(Post, {id});
    if (post){
       return {post, };

    } else{
        return {errors:[{
            field: "Error in fetching post.",
            message: "Post could not be fetched."
        }]}
    }
  }

  // @UseMiddleware(isAuth)
  // @Query(() => PaginatedPosts)
  // async homePosts(
  //   @Arg("limit", () => Int) limit: number,
  //   @Arg("cursor", () => Int) cursor: number | null,
  //   @Arg("sortBy", () => String, {nullable: true}) sortBy: string | null,
  //   @Ctx() { em, req }: MyContext
  // ): Promise<PaginatedPosts> {
  //   cursor = (cursor === null ) ? 0 : cursor;
  //   sortBy = (sortBy === null ) ? "recent" : sortBy;

  //   const user = await em.findOne(User, {id: req.session.userid});
  //   const groups = user?.subscriptions;

  //   if (user && groups){
  //     const maxLimit: number = 50;
  //     limit = Math.min(maxLimit, limit);

  //     if (sortBy === "recent"){
  //       //we have to somehow aggregate from all of them
  //       const [posts, count] = await em.findAndCount(Post, {group : {$in : groups}} , { limit: limit, offset: cursor });
  //     }

  //   }

  //   return {
  //     posts: posts.slice(0, realLimit),
  //     hasMore: posts.length === reaLimitPlusOne,
  //     cursor : cursor + limit,
  //   };
  // }

  @UseMiddleware(isAuth)
  @Query(() => PaginatedPosts)
  async trending(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => Int) cursor: number | null,
    @Arg("sortBy", () => String, {nullable: true}) sortBy: string | null,
    @Ctx() { em, req }: MyContext
  ): Promise<PaginatedPosts> {
    cursor = (cursor === null ) ? 0 : cursor;
    sortBy = (sortBy === null ) ? "recent" : sortBy;


    const maxLimit: number = 50;
    limit = Math.min(maxLimit, limit);

    if (sortBy === "best"){

      const time_period = new Date( new Date().getTime() -  1000 * 60 * 60 * 24 * 2);
      const [posts, count] = await em.findAndCount(Post, {createdAt: {$gt: time_period} }, { limit: limit, offset: cursor, orderBy: {voteCount: QueryOrder.DESC} });

      return {
        posts: posts,
        hasMore: limit+cursor+1 < count,
        cursor : cursor + limit +1,
      };
    } else { // sortBy === "recent"
      const [posts, count] = await em.findAndCount(Post, {}, { limit: limit, offset: cursor });

      return {
        posts: posts,
        hasMore: limit+cursor+1 < count,
        cursor : cursor + limit +1,
      };
    }

  }



  @Mutation(() => PostResponse)
  @UseMiddleware(isAuth)
  async create(
      @Arg("title") title: string,
      @Arg("body", {nullable: true}) body: string,
      @Arg("groupId") groupId: number,
      @Ctx() { em, req }: MyContext
  ): Promise<PostResponse> {

      const user = await em.findOne(User, {id: req.session.userid});
      const group = await em.findOne(Group, {id: groupId});

      
      if (user && group){
          // TODO: you have to be a uni member to post in a uni group
          const post =  new Post(user, title, group, body);
          await em.persistAndFlush(post);
          return {post, };
      } else{
          return {errors:[{
              field: "Error in fetching user.",
              message: "User with session id could not be fetched."
          }]}
      }
  }


  @Mutation(() => PostResponse)
  @UseMiddleware(isAuth)
  async update(
      @Arg("id", () => Int) id: number, 
      @Arg("title", {nullable: true}) title: string,
      @Arg("body", {nullable: true}) body: string,
      @Ctx() { em }: MyContext
  ): Promise<PostResponse> {

      const post = await em.findOne(Post, {id});
      if (post){
      if (title){post.title = title;}
      if (body){post.body = body;}

      post.wasEdited = true;

      await em.persistAndFlush(post);
      return {post, };

      } else{
          return {errors:[{
              field: "Error in fetching post.",
              message: "Post with id could not be fetched."
          }]}
      }
  }


  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async delete(
      @Arg("id") id : number,
      @Ctx() { em, req}: MyContext
      ) : Promise<boolean>{

      let isAuth = false;
      const post = await em.findOne(Post, {id});
      if(post){
          const group = post.group;
          // check if user is creator or moderator
          if(post.owner.id === req.session.userid){
              isAuth = true;
          }
          for(const moderator of group.moderators){
              if(moderator.id === req.session.userid){
                  isAuth = true;
              }
          }

          if(isAuth){
              await em.nativeDelete(Post, {id});
              return true;
          }
      }
      return false;
  };


  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("id", ()=>Int) id: number,
    @Arg("value") value: number,
    @Ctx() {em,req} : MyContext
  ): Promise<boolean>{

    //resolve value to -1,0,1
    (value === 0) ? value = 0 : 
    (value > 1) ? value = 1 : value = -1;

    const user = await em.findOne(User, {id: req.session.userid});
    const post = await em.findOne(Post, {id});
    if(user && post){

      const postVote = await em.findOne(PostVote, {post, user});  //check if vote exists
      if (postVote){
          post.voteCount -= postVote.value;
          postVote.value = value;
          post.voteCount += postVote.value;
          await em.persistAndFlush(postVote);
      }else{
        const newPostVote = new PostVote(user, post, value);
        post.voteCount -= newPostVote.value;

        await em.persistAndFlush(newPostVote);
      }
      await em.persistAndFlush(post);
      return true;    

    }else{
      return false;
    }
  }



@Mutation(() => Boolean)
@UseMiddleware(isAuth)
async save(
  @Arg("id", ()=>Int) id: number,
  @Ctx() {em,req} : MyContext
): Promise<boolean>{
  const user = await em.findOne(User, {id: req.session.userid});
  const post = await em.findOne(Post, {id});
  if(user && post){

    user.savedPosts.add(post);
    em.persistAndFlush(user);
    return true;
  }else{
    return false;
  }
  }
}