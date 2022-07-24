import { Collection, Entity, PrimaryKey, Property, OneToMany } from "@mikro-orm/core";
import { User } from "./User";
import { Group } from "./Group";
import { ObjectType, Field } from "type-graphql";


@ObjectType()
@Entity()
export class University {

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
  description: string = "Description goes here";

  @Field()
  @Property()
  isDisabled:boolean = false;

  @Field()
  @Property()
  logoImgUrl:string = "https://i.imgur.com/OQENGf1.jpeg";

  @Field()
  @Property()
  bannerImgUrl:string = "https://i.imgur.com/OQENGf1.jpeg";

  @OneToMany(() => User, user => user.university)
  students = new Collection<User>(this);

  @OneToMany(() => Group, group=> group.university)
  groups = new Collection<Group>(this);

  constructor(name : string){
    this.name = name;
  }

}