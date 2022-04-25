import { Entity, PrimaryKey, Property, ManyToOne, Collection, ManyToMany, OneToMany} from "@mikro-orm/core";
import { Category } from "./Category";
import { User } from "./User";
import { PostVote } from "./PostVote";

import { ObjectType, Field } from "type-graphql";


@ObjectType()
@Entity()
export class Post {

  @Field()
  @PrimaryKey()
  id!: number;

  @Field()
  @Property()
  createdAt = new Date();

  @Field()
  @Property()
  updatedAt = new Date();

  @Field()
  @Property({ length:100})
  title!: string;

  @Field()
  @Property({length:15000})
  body = "";

  @Field()
  @Property()
  isDisabled = false;

  @ManyToOne(() => Category)
  category: Category;

  @ManyToOne(() => User)
  owner: User;

  @ManyToMany(() => User, user => user.savedPosts)
  savers = new Collection<User>(this);

  @OneToMany(() => PostVote, postvote => postvote.post)
  votes = new Collection<PostVote>(this);


  constructor(owner: User, title: string, body: string | null){
    this.owner = owner;
    this.title = title;
    if (body){
      this.body = body;
    }
  }


}