import { Collection, Entity, ManyToMany, PrimaryKey, Property, OneToMany } from "@mikro-orm/core";

import { User } from "./User";
import { Post } from "./Post";

@Entity()
export class Category {

  @PrimaryKey()
  id!: number;

  @Property()
  createdAt = new Date();

  @Property({length:60})
  name!: string;

  @Property({length:3000})
  description!: string;

  @Property()
  isDisabled = false;

  @Property()
  logoImgUrl = "https://i.imgur.com/OQENGf1.jpeg";

  @Property()
  bannerImgUrl = "https://i.imgur.com/OQENGf1.jpeg";

  @ManyToMany(() => User, user => user.subscriptions)
  members = new Collection<User>(this);

  @OneToMany(()=> Post, post => post.category)
  posts = new Collection<Post>(this);

  @ManyToMany(() => User, user => user.moderating)
  moderators = new Collection<User>(this);


}