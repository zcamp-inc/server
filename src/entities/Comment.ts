import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection } from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";

// import { CommentVote } from "./CommentVote";
import { Post } from "./Post";
import { User } from "./User";

@ObjectType()
@Entity()
export class Comment {

  @Field()
  @PrimaryKey()
  id!: number;

  @Field()
  @Property()
  createdAt: Date = new Date();

  @Field()
  @Property()
  updatedAt: Date = new Date();

  @Field(() => String)
  @Property({length:30000})
  body: string;

  @Field()
  @Property()
  isDisabled: boolean = false;

  @Field()
  @Property()
  wasEdited: boolean = false;

  @Field()
  @Property()
  voteCount: number = 0;

  @ManyToOne(() => Post)
  post: Post;

  // if parentComment is null then parent is post
  @ManyToOne(() => Comment, {nullable: true})
  parentComment: Comment | null;

  @OneToMany(() => Comment, comment =>comment.parentComment)
  children = new Collection<Comment>(this);

  @ManyToOne(() => User)
  owner: User;

  // @OneToMany(() => CommentVote, commentVote => commentVote.comment)
  // votes = new Collection<CommentVote>(this);

  constructor(owner: User, body: string, post:Post, parentComment: Comment | null ){
    this.owner = owner;
    this.body = body;
    this.post = post;

    if (parentComment){
      this.parentComment = parentComment;
    }
  }



}