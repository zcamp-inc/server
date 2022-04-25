import { Entity, PrimaryKey, Property, ManyToOne } from "@mikro-orm/core";
import { User } from "./User";
import { Post } from "./Post";


@Entity()
export class PostVote {

  @PrimaryKey()
  userId!: number;

  @PrimaryKey()
  postId!: number;

  @Property()
  value: number;

  @ManyToOne(() => Post, {onDelete: "CASCADE"})
  post: Post;

  @ManyToOne(() => User, {onDelete: "CASCADE"})
  user: User;


  constructor(user: User, post:Post, value: number){
    this.user = user;
    this.post = post;
    this.value = value;
  }


}