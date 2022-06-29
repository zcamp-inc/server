
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
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX, HTML_LINK } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateNewPass, validateRegister } from "../utils/validateRegister";
import { UserResponse } from "../types";
import {getUniversity} from "../utils/getUniversity";
import { University } from "../entities/University";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from 'uuid';


@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userid === user.id) {
      return user.email;
    }
    return "";
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() {redis, em, req}: MyContext
  ): Promise<UserResponse> {
    const errors = validateNewPass(newPassword);
    if (errors) {
      return { errors };
    }
    const key = FORGET_PASSWORD_PREFIX + token
    const userId = await redis.get(key)
    if (!userId){
      return{
        errors: [
          {
            field: "token",
            message: "token expired"
          },
        ]
      };
    }

    const user = await em.fork({}).findOne(User, { id: parseInt(userId) })
    if(!user){
      return{
        errors: [
          {
            field: "token",
            message: "user no longer exists"
          }
        ]
      }
    }

    user.passwordHash = await argon2.hash(newPassword);
    await em.fork({}).persistAndFlush(user);

    await redis.del(key)

    //login user on password change [success]
    req.session.userid = user.id;
    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() {em, redis} : MyContext
  ){
    const user = await em.fork({}).findOne(User, {email});
    if(!user){
      // the email is not in db
      return true;
    }
    const token = v4();
    await redis.set(FORGET_PASSWORD_PREFIX + token, user.id, "EX", 1000 * 60 * 60 * 24);
    await sendEmail(email, HTML_LINK) 
    return true
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
  async registerUser(
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
              req.session.userid = user.id;
              return { user, };
            } catch(err) {
              if (err.code === "23505"){ 
                return{
                  errors: [
                    {
                      field: "username",
                      message: "Username already taken"
                    }
                  ]
                }
            } else {
              return {
                errors : [{
                  field : "Could not create user",
                  message: err.message
              }]
              }
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
  async loginUser(
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
  logoutUser(@Ctx() { req, res }: MyContext) {
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
