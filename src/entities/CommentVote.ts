import { Entity, PrimaryKey, Property, ManyToOne } from "@mikro-orm/core";
import { User } from "./User";
import { Comment } from "./Comment";



@Entity()
export class CommentVote {

  @PrimaryKey()
  userId!: number;

  @PrimaryKey()
  commentId!: number;

  @Property()
  value: number;

  @ManyToOne(() => Comment, {onDelete: "CASCADE"})
  comment: Comment;

  @ManyToOne(() => User, {onDelete: "CASCADE"})
  user: User;


}