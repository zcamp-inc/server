import {
    Resolver,
    Mutation,
    Ctx,
  } from "type-graphql";

import { MyContext } from "../types";
import { University } from "../entities/University";


@Resolver(University)
export class UniversityResolver {

  @Mutation(() => String)
  async seed(@Ctx() { em }: MyContext): Promise<String>{
    const uniList  = ['Covenant University']
    uniList.forEach((name) => {
        const uni = new University(name);
        em.fork({}).persistAndFlush(uni);
    })
    return "Universities seeded" 
  }
}