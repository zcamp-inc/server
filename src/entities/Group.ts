import { Collection, Entity, ManyToMany, PrimaryKey, Property, OneToMany } from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";

import { User } from "./User";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class Group {

  @Field()
  @PrimaryKey()
  id!: number;

  @Field()
  @Property()
  createdAt: Date = new Date();

  @Field()
  @Property({length:60})
  name!: string;

  @Field()
  @Property({length:3000})
  description!: string;

  @Field()
  @Property()
  isDisabled: boolean = false;

  @Field()
  @Property()
  logoImgUrl: string = "https://i.imgur.com/OQENGf1.jpeg";

  @Field()
  @Property()
  bannerImgUrl: string = "https://i.imgur.com/OQENGf1.jpeg";

  @ManyToMany(() => User, user => user.subscriptions)
  members = new Collection<User>(this);

  @OneToMany(()=> Post, post => post.group)
  posts = new Collection<Post>(this);

  @ManyToMany(() => User, user => user.moderating)
  moderators = new Collection<User>(this);

  
  constructor(name: string, description:string){
    this.name = name;
    this.description = description;
  }
}