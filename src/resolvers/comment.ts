
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
import { CommentVote } from "../entities/CommentVote";
import { UserResponse, PostResponse, CommentResponse, CommentsResponse } from "../types";

@Resolver(Comment)
export class CommentResolver {


  @FieldResolver(() => String)
  bodySnippet(@Root() comment: Comment){
    return comment.body.slice(0,100);
  }

  @FieldResolver(() => User)
  async creator(
    @Root() comment: Comment, 
    @Ctx() {em} : MyContext
  ): Promise<UserResponse>{
    const user =  await em.fork({}).findOne(User, {id: comment.owner.id});
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
    const post =  await em.fork({}).findOne(Post, {id: comment.post.id});
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
  async getComment(
    @Arg("id") id: number,
    @Ctx() {em}: MyContext
): Promise<CommentResponse> {
    const comment = await em.fork({}).findOne(Comment, {id});
    if (comment){
       return {comment, };

    } else{
        return {errors:[{
            field: "Error in fetching comment.",
            message: "Comment could not be fetched."
        }]}
    }
  }


  @Query(() => CommentsResponse, { nullable: true })
  async getPostComments(
    @Arg("postId") postId: number,
    @Ctx() {em}: MyContext
): Promise<CommentsResponse> {
    const post = await em.fork({}).findOne(Post, {id: postId}, {populate: ["comments"]});
    if (post){
        let comments = post.comments.getItems();
        return {comments, }
    } else{
        return {errors:[{
            field: "Error in fetching post.",
            message: "Post could not be fetched."
        }]}
    }
  }
  @Mutation(() => CommentResponse)
  @UseMiddleware(isAuth)
  async createComment(
      @Arg("postId", () => Int) postId: number,
      @Arg("parentCommentId", () => Int, {nullable: true}) parentCommentId : number|null,
      @Arg("body", {nullable: true}) body: string,
      @Ctx() { em, req }: MyContext
  ): Promise<CommentResponse> {

      const user = await em.fork({}).findOne(User, {id: req.session.userid});
      const post = await em.fork({}).findOne(Post, {id: postId });

      if (user && post){
          if(parentCommentId){
            const parentComment = await em.fork({}).findOne(Comment, {id: parentCommentId });
            const comment =  new Comment(user, body, post, parentComment);
            await em.fork({}).persistAndFlush(comment);
            return {comment, };
          }

          const comment =  new Comment(user, body, post, null);
          post.comments.add(comment);
          await em.fork({}).persistAndFlush(comment);
          await em.fork({}).persistAndFlush(post);
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
  async updateComment(
      @Arg("id", () => Int) id: number, 
      @Arg("body") body: string,
      @Ctx() { em }: MyContext
  ): Promise<CommentResponse> {

      const comment = await em.fork({}).findOne(Comment, {id});
      if (comment){
        comment.body = body;
        comment.wasEdited = true;
        await em.fork({}).persistAndFlush(comment);
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
  async deleteComment(
      @Arg("id") id : number,
      @Ctx() { em, req}: MyContext
      ) : Promise<boolean>{

      let isAuth = false;
      const comment = await em.fork({}).findOne(Comment, {id});
      if(comment){
          const group = comment.post.group;

          // check if user is creator or moderator
          if(comment.owner.id === req.session.userid){
              isAuth = true;
          }
          for(const moderator of group.moderators){
              if(moderator.id === req.session.userid){
                  isAuth = true;
              }
          }

          if(isAuth){
              await em.fork({}).nativeDelete(Comment , {id});
              return true;
          }
      }
      return false;
  };


  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async voteComment(
    @Arg("id", ()=>Int) id: number,
    @Arg("value") value: number,
    @Ctx() {em,req} : MyContext
  ): Promise<boolean>{

    //resolve value to -1,0,1
    (value === 0) ? value = 0 : (value >= 1) ? value = 1 : value = -1;

    const user = await em.fork({}).findOne(User, {id: req.session.userid});
    const comment = await em.fork({}).findOne(Comment, {id});
    if(user && comment){
      const commentVote = await em.fork({}).findOne(CommentVote, {commentId: comment.id, userId: user.id});  //check if vote exists
      if (commentVote){
          comment.voteCount -= commentVote.value;
          commentVote.value = value;
          comment.voteCount += commentVote.value;
          await em.fork({}).persistAndFlush(commentVote);
      }else{
        const newCommentVote = new CommentVote(user, comment, value);
        comment.voteCount += newCommentVote.value;
        await em.fork({}).persistAndFlush(newCommentVote);
      }
      await em.fork({}).persistAndFlush(comment);
      return true;    

    }else{
      return false;
    }
  }

}

