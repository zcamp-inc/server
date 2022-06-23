
import {
    Resolver,
    Ctx,
    Query,
  } from "type-graphql";

import { MyContext } from "../types";
import {Group} from "../entities/Group";
import { QueryOrder } from "@mikro-orm/core";


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
    const topGroups = await em.fork({}).find(Group, {}, {orderBy: {members: QueryOrder.DESC} });
    return topGroups; 
  }
}