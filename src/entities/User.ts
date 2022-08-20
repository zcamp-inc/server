import { Entity, PrimaryKey, Property, ManyToMany, Collection, OneToMany, ManyToOne } from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";

import { Group } from "./Group";
import { Post } from "./Post";
import { Comment } from "./Comment";
// import { PostVote } from "./PostVote";
// import { CommentVote } from "./CommentVote";
import { University } from "./University";


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

  @ManyToMany(() => Group, group => group.members, {owner: true})
  subscriptions = new Collection<Group>(this);

  @ManyToMany(() => Group, group => group.moderators, {owner: true})
  moderating = new Collection<Group>(this);

  @OneToMany(()=> Post, post => post.owner)
  posts = new Collection<Post>(this);

  @OneToMany(()=> Comment, comment => comment.owner)
  comments = new Collection<Comment>(this);

  // @OneToMany(() => PostVote, postVote => postVote.user)
  // postVotes = new Collection<PostVote>(this);

  // @OneToMany(() => CommentVote, commentVote => commentVote.user)
  // commentVotes = new Collection<PostVote>(this);

  @ManyToOne(() => University)
  university : University;

  @ManyToMany(() => Post, post => post.savers, {owner: true})
  savedPosts = new Collection<Post>(this);

  
  constructor(username: string, email: string, passwordHash: string){
    this.username = username;
    this.email = email;
    this.passwordHash = passwordHash;
  }

}