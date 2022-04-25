
import {
    Resolver,
    Mutation,
    Arg,
    Ctx,
    Query,
    FieldResolver,
    Root
  } from "type-graphql";

import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";
import {COOKIE_NAME} from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { UserResponse } from "../types";


@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userid === user.id) {
      return user.email;
    }
    return "";
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() {em, req }: MyContext) {
    if (!req.session.userid) {
      return null;
    }
    return em.findOne(User, {id : req.session.userid});
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);

    try {
      const user = new User(options.username, options.email, hashedPassword);
      em.persistAndFlush(user);

      req.session.userid = user.id;
      return { user };

    } catch (err) {
        return {
          errors: [
            {
              field: "Error occured in user creation.",
              message: err,
            },
          ],
        };
      }
    
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() {em, req }: MyContext
  ): Promise<UserResponse> {

    try{
      const user = await em.findOneOrFail(User, 
        usernameOrEmail.includes("@")
          ? { email: usernameOrEmail } 
          : { username: usernameOrEmail })

      const valid = await argon2.verify(user.passwordHash, password);
      if (!valid) {
        return {
          errors: [
            {
              field: "password",
              message: "incorrect password",
            },
          ],
        };
      }

      req.session.userid = user.id;

      return {
        user,
      };
    }

    catch(e){
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "Username or Email does not exist",
          },
        ],
      };
    }
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err: any) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
