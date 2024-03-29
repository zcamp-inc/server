import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
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

  // @ManyToOne(() => Comment, {onDelete: "CASCADE"})
  // comment: Comment;

  // @ManyToOne(() => User, {onDelete: "CASCADE"})
  // user: User;


  constructor(user: User, comment: Comment, value: number){
    // this.user = user;
    // this.comment = comment;
    this.value = value;
    this.userId = user.id;
    this.commentId = comment.id;
  }

}