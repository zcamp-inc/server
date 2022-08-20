import { Entity, PrimaryKey, Property, ManyToOne, Collection, ManyToMany} from "@mikro-orm/core";
import { Group } from "./Group";
import { User } from "./User";
// import { PostVote } from "./PostVote";

import { ObjectType, Field } from "type-graphql";


@ObjectType()
@Entity()
export class Post {

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
  @Property({ length:100})
  title!: string;

  @Field(() => String)
  @Property({length:15000})
  body = "";


  @Field()
  @Property()
  isDisabled: boolean = false;

  @Field()
  @Property()
  voteCount: number = 0;

  @Field()
  @Property()
  wasEdited: boolean = false;

  @ManyToOne(() => Group)
  group: Group;

  @ManyToOne(() => User)
  owner: User;

  // @OneToMany(() => PostVote, postvote => postvote.post)
  // votes = new Collection<PostVote>(this);

  @ManyToMany(() => User, user => user.savedPosts)
  savers = new Collection<User>(this);


  constructor(owner: User, title: string, group: Group, body: string | null){
    this.owner = owner;
    this.title = title;
    this.group = group;
    if (body){
      this.body = body;
    }
  }
}