import { Migration } from '@mikro-orm/migrations';

export class Migration20220427175656 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "user" ("id" serial primary key, "created_at" timestamptz(0) not null, "username" varchar(60) not null, "email" varchar(120) not null, "password_hash" varchar(255) not null, "is_disabled" boolean not null, "profile_img_url" varchar(255) not null);');
    this.addSql('alter table "user" add constraint "user_username_unique" unique ("username");');
    this.addSql('alter table "user" add constraint "user_email_unique" unique ("email");');

    this.addSql('create table "category" ("id" serial primary key, "created_at" timestamptz(0) not null, "name" varchar(60) not null, "description" varchar(3000) not null, "is_disabled" boolean not null, "logo_img_url" varchar(255) not null, "banner_img_url" varchar(255) not null);');

    this.addSql('create table "post" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "title" varchar(100) not null, "body" varchar(15000) not null, "is_disabled" boolean not null, "was_edited" boolean not null, "category_id" int not null, "owner_id" int not null);');

    this.addSql('create table "comment" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "body" varchar(3000) not null, "is_disabled" boolean not null, "was_edited" boolean not null, "post_id" int null, "parent_comment_id" int null, "owner_id" int not null);');

    this.addSql('create table "comment_vote" ("user_id" int not null, "comment_id" int not null, "value" int not null);');
    this.addSql('alter table "comment_vote" add constraint "comment_vote_pkey" primary key ("user_id", "comment_id");');

    this.addSql('create table "user_saved_comments" ("user_id" int not null, "comment_id" int not null);');
    this.addSql('alter table "user_saved_comments" add constraint "user_saved_comments_pkey" primary key ("user_id", "comment_id");');

    this.addSql('create table "post_vote" ("user_id" int not null, "post_id" int not null, "value" int not null);');
    this.addSql('alter table "post_vote" add constraint "post_vote_pkey" primary key ("user_id", "post_id");');

    this.addSql('create table "user_saved_posts" ("user_id" int not null, "post_id" int not null);');
    this.addSql('alter table "user_saved_posts" add constraint "user_saved_posts_pkey" primary key ("user_id", "post_id");');

    this.addSql('create table "user_subscriptions" ("user_id" int not null, "category_id" int not null);');
    this.addSql('alter table "user_subscriptions" add constraint "user_subscriptions_pkey" primary key ("user_id", "category_id");');

    this.addSql('create table "user_moderating" ("user_id" int not null, "category_id" int not null);');
    this.addSql('alter table "user_moderating" add constraint "user_moderating_pkey" primary key ("user_id", "category_id");');

    this.addSql('alter table "post" add constraint "post_category_id_foreign" foreign key ("category_id") references "category" ("id") on update cascade;');
    this.addSql('alter table "post" add constraint "post_owner_id_foreign" foreign key ("owner_id") references "user" ("id") on update cascade;');

    this.addSql('alter table "comment" add constraint "comment_post_id_foreign" foreign key ("post_id") references "post" ("id") on update cascade on delete set null;');
    this.addSql('alter table "comment" add constraint "comment_parent_comment_id_foreign" foreign key ("parent_comment_id") references "comment" ("id") on update cascade on delete set null;');
    this.addSql('alter table "comment" add constraint "comment_owner_id_foreign" foreign key ("owner_id") references "user" ("id") on update cascade;');

    this.addSql('alter table "comment_vote" add constraint "comment_vote_comment_id_foreign" foreign key ("comment_id") references "comment" ("id") on update cascade on delete CASCADE;');
    this.addSql('alter table "comment_vote" add constraint "comment_vote_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete CASCADE;');

    this.addSql('alter table "user_saved_comments" add constraint "user_saved_comments_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "user_saved_comments" add constraint "user_saved_comments_comment_id_foreign" foreign key ("comment_id") references "comment" ("id") on update cascade on delete cascade;');

    this.addSql('alter table "post_vote" add constraint "post_vote_post_id_foreign" foreign key ("post_id") references "post" ("id") on update cascade on delete CASCADE;');
    this.addSql('alter table "post_vote" add constraint "post_vote_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete CASCADE;');

    this.addSql('alter table "user_saved_posts" add constraint "user_saved_posts_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "user_saved_posts" add constraint "user_saved_posts_post_id_foreign" foreign key ("post_id") references "post" ("id") on update cascade on delete cascade;');

    this.addSql('alter table "user_subscriptions" add constraint "user_subscriptions_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "user_subscriptions" add constraint "user_subscriptions_category_id_foreign" foreign key ("category_id") references "category" ("id") on update cascade on delete cascade;');

    this.addSql('alter table "user_moderating" add constraint "user_moderating_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "user_moderating" add constraint "user_moderating_category_id_foreign" foreign key ("category_id") references "category" ("id") on update cascade on delete cascade;');
  }

}
