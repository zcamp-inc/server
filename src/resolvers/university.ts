import {
    Resolver,
    Mutation,
    Ctx,
    Query,
  } from "type-graphql";

import { MyContext } from "../types";
import { University } from "../entities/University";
import { QueryOrder } from "@mikro-orm/core";


@Resolver(University)
export class UniversityResolver {

  @Mutation(() => String)
  async seedUniversities(@Ctx() { em }: MyContext): Promise<String>{
    const uniList  = ['Covenant University', 'Coventry University']
    uniList.forEach((name) => {
        const uni = new University(name);
        em.fork({}).persistAndFlush(uni);
    })
    return "Universities seeded" 
  }


  @Query(() => [University])
  async getUniversities(@Ctx() {em}: MyContext) : 
  Promise<University[]>{
    const universities = await em.fork({}).find(University, {}, {orderBy: {name: QueryOrder.DESC} });
    return universities; 
  }
}