
import {
    Resolver,
    Mutation,
    Arg,
    Ctx,
    Query,
    FieldResolver,
    Root,
    UseMiddleware,
    Int
  } from "type-graphql";

import { MyContext } from "../types";
import { Post } from "../entities/Post";
import { isAuth } from "../middleware/isAuth";
import { User } from "src/entities/User";
import { PostVote } from "src/entities/PostVote";
import { UserResponse, PostResponse } from "../types";

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


  @Mutation(() => PostResponse)
  @UseMiddleware(isAuth)
  async create(
      @Arg("title") title: string,
      @Arg("body", {nullable: true}) body: string | null,
      @Ctx() { em, req }: MyContext
  ): Promise<PostResponse> {

      const user = await em.findOne(User, {id: req.session.userid});
      if (user){
          const post =  new Post(user, title, body);
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
      @Arg("title", {nullable: true}) title: string | null,
      @Arg("body", {nullable: true}) body: string | null,
      @Ctx() { em, req }: MyContext
  ): Promise<PostResponse> {

      const post = await em.findOne(Post, {id});
      if (post){
      if (title){post.title = title;}
      if (body){post.body = body;}

      await em.persistAndFlush(post);
      return {post, };

      } else{
          return {errors:[{
              field: "Error in fetching post.",
              message: `Post with id ${id} could not be fetched.`
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
          const category = post.category;

          // check if user is creator or moderator
          if(post.owner.id === req.session.userid){
              isAuth = true;
          }
          for(const moderator of category.moderators){
              if(moderator.id === req.session.userid){
                  isAuth = true;
              }
          }

          if(isAuth){
              await em.nativeDelete(Post, {id: post.id});
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
          postVote.value = value;
          await em.persistAndFlush(postVote);
      }else{
        const newPostVote = new PostVote(user, post, value);
        await em.persistAndFlush(newPostVote);
      }
      return true;    

    }else{
      return false;
    }
  }

}

