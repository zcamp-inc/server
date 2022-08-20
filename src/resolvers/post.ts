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

  @FieldResolver(() => String)
  bodySnippet(@Root() post: Post) {
    return post.body.slice(0, 100);
  }

  @FieldResolver(() => Group)
  group(@Root() post: Post){
    return post.group;
  }

  @FieldResolver(() => UserResponse)
  async creator(
    @Root() post: Post,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const user = await em.fork({}).findOne(User, { id: post.owner.id });
    if (user) {
      return { user };
    } else {
      return {
        errors: [
          {
            field: "User not found.",
            message: "User could not be fetched.",
          },
        ],
      };
    }
  }

  @Query(() => PostResponse)
  async getPost(
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<PostResponse> {
    const post = await em
      .fork({})
      .findOne(
        Post,
        { id: id },
        {
          populate: [
            // "votes",
            "savers",
            "title",
            "body",
            "id",
            "createdAt",
            "updatedAt",
            "wasEdited",
            "voteCount",
            "group",
            "owner",
            "owner.id",
          ],
        }
      );
    if (post) {
      return { post };
    } else {
      return {
        errors: [
          {
            field: "Error in fetching post.",
            message: "Post could not be fetched.",
          },
        ],
      };
    }
  }

  @Query(() => PaginatedPosts)
  @UseMiddleware(isAuth)
  async userPosts(
    @Arg("limit") limit: number,
    @Arg("cursor", { defaultValue: 0 }) cursor: number,
    @Arg("sortBy", () => String, { nullable: true }) sortBy: string | null,
    @Ctx() { em, req }: MyContext
  ): Promise<PaginatedPosts> {
    cursor = cursor === null ? 0 : cursor;
    sortBy = sortBy === null ? "recent" : sortBy;

    const user = await em
      .fork({})
      .findOne(
        User,
        { id: req.session.userid},
        { populate: ["posts"] }
      );
      
    if (user) {
      const maxLimit: number = 50;
      limit = Math.min(maxLimit, limit);

      const endIndex = cursor + limit;
      const posts = user.posts.getItems();
      if(endIndex > posts.length){
        return {
          posts : posts.slice(cursor),
          hasMore: false,
          cursor: posts.length-1
        }
      }else{
        return{
          posts: posts.slice(cursor, cursor+limit),
          hasMore: false,
          cursor: cursor+limit
        }
      }

    } else {
      return {
        posts: [],
        hasMore: false,
        cursor: -1,
      };
    }
  }

  @Query(() => PaginatedPosts)
  @UseMiddleware(isAuth)
  async homePosts(
    @Arg("limit") limit: number,
    @Arg("cursor", { defaultValue: 0 }) cursor: number,
    @Arg("sortBy", () => String, { nullable: true }) sortBy: string | null,
    @Ctx() { em, req }: MyContext
  ): Promise<PaginatedPosts> {
    cursor = cursor === null ? 0 : cursor;
    sortBy = sortBy === null ? "recent" : sortBy;

    const user = await em
      .fork({})
      .findOne(
        User,
        { id: req.session.userid },
        { populate: ["subscriptions"] }
      );
    if (user) {
      await user.subscriptions.init();
      const groups = user.subscriptions.getItems();

      if (groups) {
        const maxLimit: number = 50;
        limit = Math.min(maxLimit, limit);

        if (sortBy === "recent") {
          const time_period = new Date(
            new Date().getTime() - 1000 * 60 * 60 * 24 * 10
          );
          const [posts, count] = await em
            .fork({})
            .findAndCount(
              Post,
              { createdAt: { $gt: time_period }, group: { $in: groups } },
              {
                limit: limit,
                populate: [
                  // "votes",
                  "savers",
                  "title",
                  "body",
                  "id",
                  "createdAt",
                  "updatedAt",
                  "wasEdited",
                  "voteCount",
                  "group",
                  "owner",
                  "owner.id",
                ],
                offset: cursor,
                orderBy: { voteCount: QueryOrder.DESC },
              }
            );
            console.log(groups);
            return {
            posts: posts,
            hasMore: limit + cursor + 1 < count,
            cursor: cursor + limit + 1,
          };
        } else {
          // (sortBy === "new")
          const time_period = new Date(
            new Date().getTime() - 1000 * 60 * 60 * 24 * 2
          );
          const [posts, count] = await em
            .fork({})
            .findAndCount(
              Post,
              { createdAt: { $gt: time_period }, group: { $in: groups } },
              {
                limit: limit,
                populate: [
                  // "votes",
                  "savers",
                  "title",
                  "body",
                  "id",
                  "createdAt",
                  "updatedAt",
                  "wasEdited",
                  "voteCount",
                  "group",
                  "owner",
                  "owner.id",
                ],
                offset: cursor,
                orderBy: { createdAt: QueryOrder.DESC },
              }
            );
          console.log(groups);

          return {
            posts: posts || [],
            hasMore: limit + cursor + 1 < count,
            cursor: cursor + limit + 1,
          };
        }
      } else {
        return {
          posts: [],
          hasMore: false,
          cursor: -1,
        };
      }
    } else {
      return {
        posts: [],
        hasMore: false,
        cursor: -1,
      };
    }
  }


  @Query(() => PaginatedPosts)
  async trendingPosts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => Int) cursor: number | null,
    @Arg("sortBy", () => String, { nullable: true }) sortBy: string | null,
    @Ctx() { em, req }: MyContext
  ): Promise<PaginatedPosts> {
    cursor = cursor === null ? 0 : cursor;
    sortBy = sortBy === null ? "recent" : sortBy;

    const maxLimit: number = 50;
    limit = Math.min(maxLimit, limit);

    if (sortBy === "best") {
      const time_period = new Date(
        new Date().getTime() - 1000 * 60 * 60 * 24 * 20
      );
      const [posts, count] = await em.fork({}).findAndCount(
        Post,
        { createdAt: { $gt: time_period } },
        {
          limit: limit,
          offset: cursor,
          populate: [
            // "votes",
            "savers",
            "title",
            "body",
            "id",
            "createdAt",
            "updatedAt",
            "wasEdited",
            "voteCount",
            "group",
            "owner",
            "owner.id",
          ],
          orderBy: { voteCount: QueryOrder.DESC },
        }
      );

      return {
        posts: posts,
        hasMore: limit + cursor + 1 < count,
        cursor: cursor + limit + 1,
      };
    } else {
      // sortBy === "recent"
      const [posts, count] = await em
        .fork({})
        .findAndCount(
          Post,
          {},
          {
            limit: limit,
            offset: cursor,
            populate: [
              // "votes",
              "savers",
              "title",
              "body",
              "id",
              "createdAt",
              "updatedAt",
              "wasEdited",
              "voteCount",
              "group",
              "owner",
              "owner.id",
            ],
          }
        );

      return {
        posts: posts,
        hasMore: limit + cursor + 1 < count,
        cursor: cursor + limit + 1,
      };
    }
  }

  @Mutation(() => PostResponse)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("title") title: string,
    @Arg("body", { nullable: true }) body: string,
    @Arg("groupId") groupId: number,
    @Ctx() { em, req }: MyContext
  ): Promise<PostResponse> {
    const user = await em.fork({}).findOne(User, { id: req.session.userid });
    const group = await em.fork({}).findOne(Group, { id: groupId });

    if (user && group) {
      // TODO: you have to be a uni member to post in a uni group
      const post = new Post(user, title, group, body);
      await em.fork({}).persistAndFlush(post);
      return { post };
    } else {
      return {
        errors: [
          {
            field: "Error in fetching user.",
            message: "User with session id could not be fetched.",
          },
        ],
      };
    }
  }

  @Mutation(() => PostResponse)
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", { nullable: true }) title: string,
    @Arg("body", { nullable: true }) body: string,
    @Ctx() { em }: MyContext
  ): Promise<PostResponse> {
    const post = await em.fork({}).findOne(Post, { id });
    if (post) {
      if (title) {
        post.title = title;
      }
      if (body) {
        post.body = body;
      }

      post.wasEdited = true;

      await em.fork({}).persistAndFlush(post);
      return { post };
    } else {
      return {
        errors: [
          {
            field: "Error in fetching post.",
            message: "Post with id could not be fetched.",
          },
        ],
      };
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id") id: number,
    @Ctx() { em, req }: MyContext
  ): Promise<boolean> {
    let isAuth = false;
    const post = await em.fork({}).findOne(Post, { id });
    if (post) {
      const group = post.group;
      // check if user is creator or moderator
      if (post.owner.id === req.session.userid) {
        isAuth = true;
      }
      for (const moderator of group.moderators) {
        if (moderator.id === req.session.userid) {
          isAuth = true;
        }
      }

      if (isAuth) {
        await em.fork({}).nativeDelete(Post, { id });
        return true;
      }
    }
    return false;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async votePost(
    @Arg("id", () => Int) id: number,
    @Arg("value") value: number,
    @Ctx() { em, req }: MyContext
  ): Promise<boolean> {
    //resolve value to -1,0,1
    value === 0 ? (value = 0) : value >= 1 ? (value = 1) : (value = -1);

    const user = await em.fork({}).findOne(User, { id: req.session.userid });
    const post = await em
      .fork({})
      .findOne(Post, { id }, { populate: ["voteCount"] });
  
    if (user && post) {
      const postVote = await em.fork({}).findOne(PostVote, { postId: post.id, userId: user.id }); //check if vote exists
      if (postVote) {
        post.voteCount -= postVote.value;
        postVote.value = value;
        post.voteCount += postVote.value;
        await em.fork({}).persistAndFlush(postVote);
      } else {
        const newPostVote = new PostVote(user, post, value);
        post.voteCount += newPostVote.value;

        // post.votes.add(newPostVote);
        await em.fork({}).persistAndFlush(newPostVote);
      }
      await em.fork({}).persistAndFlush(post);
      return true;
    } else {
      return false;
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async savePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { em, req }: MyContext
  ): Promise<boolean> {
    const user = await em.fork({}).findOne(User, { id: req.session.userid });
    const post = await em
      .fork({})
      .findOne(Post, { id }, { populate: ["savers"] });
    if (user && post) {
      user.savedPosts.add(post);
      post.savers.add(user);
      em.fork({}).persistAndFlush(user);
      return true;
    } else {
      return false;
    }
  }
}
