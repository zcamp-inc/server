
import {
    Resolver,
    Ctx,
    Query,
    Arg,
    UseMiddleware,
    Mutation,
  } from "type-graphql";

import { MyContext } from "../types";
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

  @Mutation(() => [Group])
  @UseMiddleware(isAuth)
  async getUserGroups(
      @Ctx() { em, req }: MyContext
  ): Promise<Group[]> {
    const user = await em.fork({}).findOne(User, {id: req.session.userid}, {populate: ['subscriptions']});

      if (user){
        console.log(user.subscriptions.getItems())
          return user.subscriptions.getItems()
      } 
      return [];
  }


  @Mutation(() => [User])
  async getGroupUsers(
      @Arg("groupId") groupId: number,
      @Ctx() { em, req }: MyContext
  ): Promise<User[]> {

    const group = await em.fork({}).findOne(Group, {id: groupId});

      if (group){
          return group.members.getItems();
      } 
      return [];
  }

}