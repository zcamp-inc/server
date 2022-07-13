
import {
    Resolver,
    Ctx,
    Query,
    Arg,
    UseMiddleware,
    Mutation,
  } from "type-graphql";

import { GroupResponse, MyContext } from "../types";
import {Group} from "../entities/Group";
import { QueryOrder } from "@mikro-orm/core";
import { isAuth } from "../middleware/isAuth";
import { User } from "../entities/User";


@Resolver(Group)
export class GroupResolver {

  @Query(() => [Group])
  async getGroups(@Ctx() {em}: MyContext) : 
  Promise<Group[]>{
    const groups= await em.fork({}).find(Group, {}, {orderBy: {name: QueryOrder.DESC} });
    return groups; 
  }

  @Query(() => [Group])
  async topGroups(@Ctx() {em}: MyContext) : 
  Promise<Group[]>{
    const topGroups = await em.fork({}).find(Group, {}, {orderBy: {members: QueryOrder.DESC}, limit: 5 });
    return topGroups; 
  }
  
  @Query(() => [Group])
  @UseMiddleware(isAuth)
  async getUserGroups(
      @Ctx() { em, req }: MyContext
  ): Promise<Group[]> {
    const user = await em.fork({}).findOne(User, {id: req.session.userid}, {populate: ['subscriptions']});

    if (user){
        const groups = user.subscriptions.getItems();
        return groups

    } 
    return [];
  }


  @Query(() => Number)
  async getGroupUserCount(
      @Arg("groupId") groupId: number,
      @Ctx() { em }: MyContext
  ): Promise<number> {

    const group = await em.fork({}).findOne(Group, {id: groupId}, {populate: ["members"]});
    if (group){
       return group.members.count();
    } 
      return -1;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async joinGroup(
      @Arg("groupId") groupId: number,
      @Ctx() { em, req }: MyContext
  ): Promise<boolean> {
    const user = await em.fork({}).findOne(User, {id: req.session.userid});
    const group = await em.fork({}).findOne(Group, {id: groupId});

      if (user && group){
          // TODO: you have to be a uni member to join a group
          user.subscriptions.add(group);
          group.members.add(user);
          await em.fork({}).persistAndFlush(user);
          await em.fork({}).persistAndFlush(group);

          return true;
      } 
      return false;
  }

  @Mutation(() => GroupResponse)
  @UseMiddleware(isAuth)
  async createGroup(
    @Arg("name") name: string,
    @Arg("description") description: string,
    //we can make it optional to create with logo and banner images
    @Ctx() { em, req }: MyContext
  ): Promise<GroupResponse> {
    const user = await em.fork({}).findOne(User, { id: req.session.userid });

    if (user){
      const group = new Group(name, description);
      group.moderators.add(user);
      group.members.add(user);
      user.subscriptions.add(group); 
      user.moderating.add(group);
      await em.fork({}).persistAndFlush(group);
      await em.fork({}).persistAndFlush(user);
      return { group, };
    } else {
      return {
        errors: [
          {
            field: "Error creating group.",
            message: "User with session id could not be fetched.",
          },
        ],
      };
    }
  }


  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async updateGroupDetails(
    @Arg("groupId") groupId: number,
    @Arg("name", { nullable: true }) name: string,
    @Arg("description", { nullable: true }) description: string,
    @Arg("logoImgUrl", { nullable: true }) logoImgUrl: string,
    @Arg("bannerImgUrl", { nullable: true }) bannerImgUrl: string,
    @Ctx() { em, req }: MyContext
  ): Promise<boolean> {
    const user = await em.fork({}).findOne(User, { id: req.session.userid });
    const group = await em.fork({}).findOne(Group, {id: groupId});

    if (user && group){
      //check if moderator
      if (group.moderators.contains(user)){
        //alter details
        group.name = name ? name : group.name;
        group.description= description? description: group.description;
        group.logoImgUrl = logoImgUrl ? logoImgUrl : group.logoImgUrl;
        group.bannerImgUrl = bannerImgUrl ? bannerImgUrl : group.bannerImgUrl;

        return true;
      } else{
        return false;
      }
    }
    else{
      return false;
    }
      
  }



}