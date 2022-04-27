
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
import { Comment } from "../entities/Comment";
import { isAuth } from "../middleware/isAuth";
import { User } from "../entities/User";
import { CommentVote } from "src/entities/CommentVote";
import { UserResponse, PostResponse, CommentResponse } from "../types";

@Resolver(Post)
export class PostResolver {

  @FieldResolver(() => Int)
  voteCount(@Root() comment: Comment){
    return comment.votes.count();
  }

  @FieldResolver(() => String)
  bodySnippet(@Root() comment: Comment){
    return comment.body.slice(0,100);
  }

  @FieldResolver(() => User)
  async creator(
    @Root() comment: Comment, 
    @Ctx() {em} : MyContext
  ): Promise<UserResponse>{
    const user =  await em.findOne(User, {id: comment.owner.id});
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


  @FieldResolver(() => User)
  async post(
    @Root() comment: Comment, 
    @Ctx() {em} : MyContext
  ): Promise<PostResponse>{
    const post =  await em.findOne(Post, {id: comment.post.id});
    if (post){
      return {post,};
    }else{
      return {
        errors: [{
          field: "Post not found.",
          message: "Post could not be fetched."
        }]
      }
    }
  }


  @Query(() => Comment, { nullable: true })
  async get(
    @Arg("id") id: number,
    @Ctx() {em}: MyContext
): Promise<CommentResponse> {
    const comment = await em.findOne(Comment, {id});
    if (comment){
       return {comment, };

    } else{
        return {errors:[{
            field: "Error in fetching comment.",
            message: "Comment could not be fetched."
        }]}
    }
  }


  @Mutation(() => CommentResponse)
  @UseMiddleware(isAuth)
  async create(
      @Arg("postId", () => Int) postId: number,
      @Arg("parentCommentId", () => Int, {nullable: true}) parentCommentId : number|null,
      @Arg("body", {nullable: true}) body: string,
      @Ctx() { em, req }: MyContext
  ): Promise<CommentResponse> {

      const user = await em.findOne(User, {id: req.session.userid});
      const post = await em.findOne(Post, {id: postId });

      if (user && post){
          if(parentCommentId){
            const parentComment = await em.findOne(Comment, {id: parentCommentId });
            const comment =  new Comment(user, body, post, parentComment);
            await em.persistAndFlush(comment);
            return {comment, };
          }

          const comment =  new Comment(user, body, post, null);
          await em.persistAndFlush(comment);
          return {comment, };

      } else{
          return {errors:[{
              field: "Error in fetching user or post.",
              message: "User with session id or Post with postid could not be fetched."
          }]}
      }
  }


  @Mutation(() => CommentResponse)
  @UseMiddleware(isAuth)
  async update(
      @Arg("id", () => Int) id: number, 
      @Arg("body") body: string,
      @Ctx() { em }: MyContext
  ): Promise<CommentResponse> {

      const comment = await em.findOne(Comment, {id});
      if (comment){
        comment.body = body;
        comment.wasEdited = true;
        await em.persistAndFlush(comment);
        return {comment, };

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
      const comment = await em.findOne(Comment, {id});
      if(comment){
          const category = comment.post.category;

          // check if user is creator or moderator
          if(comment.owner.id === req.session.userid){
              isAuth = true;
          }
          for(const moderator of category.moderators){
              if(moderator.id === req.session.userid){
                  isAuth = true;
              }
          }

          if(isAuth){
              await em.nativeDelete(Comment , {id});
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
    const comment = await em.findOne(Comment, {id});
    if(user && comment){
      const commentVote = await em.findOne(CommentVote, {comment, user});  //check if vote exists
      if (commentVote){
          commentVote.value = value;
          await em.persistAndFlush(commentVote);
      }else{
        const newCommentVote = new CommentVote(user, comment, value);
        await em.persistAndFlush(newCommentVote);
      }
      return true;    

    }else{
      return false;
    }
  }

}

