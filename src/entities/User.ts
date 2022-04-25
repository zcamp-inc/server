import { Entity, PrimaryKey, Property, ManyToMany, Collection, OneToMany } from "@mikro-orm/core";
import { Category } from "./Category";
import { Post } from "./Post";
import { Comment } from "./Comment";
import { PostVote } from "./PostVote";
import { CommentVote } from "./CommentVote";

import { ObjectType, Field } from "type-graphql";

@ObjectType()
@Entity()
export class User {

  @Field()
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property()
  createdAt = new Date();

  @Field()
  @Property({unique: true, length:60})
  username!: string;

  @Property({unique: true, length:120})
  email!: string;

  @Property()
  passwordHash!: string;

  @Field(() => Boolean)
  @Property()
  isDisabled = false;
  
  @Field(() => String)
  @Property()
  profileImgUrl = "https://i.imgur.com/OQENGf1.jpeg";


  @ManyToMany(() => Category, category => category.members, {owner: true})
  subscriptions = new Collection<Category>(this);

  @ManyToMany(() => Category, category => category.moderators, {owner: true})
  moderating = new Collection<Category>(this);

  @OneToMany(()=> Post, post => post.owner)
  posts = new Collection<Post>(this);

  @OneToMany(()=> Comment, comment => comment.owner)
  comments = new Collection<Comment>(this);

  @ManyToMany(() => Post, post => post.savers, {owner: true})
  savedPosts = new Collection<Post>(this);

  @ManyToMany(() => Comment, comment  => comment.savers, {owner: true})
  savedComments = new Collection<Post>(this);

  
  @OneToMany(() => PostVote, postVote => postVote.user)
  postVotes = new Collection<PostVote>(this);


  @OneToMany(() => CommentVote, commentVote => commentVote.user)
  commentVotes = new Collection<PostVote>(this);


  constructor(username: string, email: string, passwordHash: string){
    this.username = username;
    this.email = email;
    this.passwordHash = passwordHash;
  }

}