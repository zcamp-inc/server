
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
import {getUniversity} from "../utils/getUniversity";
import { University } from "../entities/University";


@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userid === user.id) {
      return user.email;
    }
    return "";
  }

  @Query(() => UserResponse, { nullable: true })
  async me(@Ctx() {em, req }: MyContext)
  :Promise<UserResponse> {
    if (!req.session.userid) {
      return{
        errors: [
          {
            field: "User not logged in",
            message: "Cannot fetch user data because no user is logged in."
          }
        ]
      }
    }
    try{

        const user = await em.fork({}).findOneOrFail(User, {id : req.session.userid});
        return {
          user,
        }
    } catch (err) {
        return {
          errors: [
            {
              field: "Error occured while fetching user.",
              message: err,
            },
          ],
        };
      }
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
    let university = getUniversity(options.email);

    try {
      if (university){
        const uni = await em.fork({}).getRepository(University).findOneOrFail({name: university});
        
        
        if (uni){
            try{
              const user = new User( options.username, options.email, hashedPassword );
              user.university = await em.fork({}).getRepository(University).findOneOrFail({name: university})
              await em.fork({}).persistAndFlush(user);
            
              // uni.students.add(user);
              // em.fork({}).persistAndFlush(uni);

              // user = await em.fork({}).getRepository(User).findOneOrFail({})
              // req.session.userid = user.id;
              return { user, };
            } catch(err) {
              return {
                errors : [{
                  field : "Could not create user",
                  message: err.message
              }]
              }
            }
          } else{
            return {
              errors: [
                {
                  field: "Error occured in user creation.",
                  message: "University from email could not be found.",
                },
              ],};
          }
      } else{
        //TODO: this is where we would create a non-student account
        return {
          errors: [
            {
              field: "Error occured in user creation.",
              message: "University from email does not exist.",
            },
          ],
        };
      }
    
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
      const user = await em.fork({}).findOneOrFail(User, 
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
