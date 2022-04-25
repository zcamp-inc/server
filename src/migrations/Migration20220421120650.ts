import { Migration } from '@mikro-orm/migrations';

export class Migration20220421120650 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" drop constraint if exists "user_is_disabled_check";');
    this.addSql('alter table "user" alter column "is_disabled" drop default;');
    this.addSql('alter table "user" alter column "is_disabled" type boolean using ("is_disabled"::boolean);');
    this.addSql('alter table "user" drop constraint if exists "user_profile_img_url_check";');
    this.addSql('alter table "user" alter column "profile_img_url" drop default;');
    this.addSql('alter table "user" alter column "profile_img_url" type varchar(255) using ("profile_img_url"::varchar(255));');

    this.addSql('alter table "category" drop constraint if exists "category_description_check";');
    this.addSql('alter table "category" alter column "description" drop default;');
    this.addSql('alter table "category" alter column "description" type varchar(3000) using ("description"::varchar(3000));');
    this.addSql('alter table "category" drop constraint if exists "category_is_disabled_check";');
    this.addSql('alter table "category" alter column "is_disabled" drop default;');
    this.addSql('alter table "category" alter column "is_disabled" type boolean using ("is_disabled"::boolean);');
    this.addSql('alter table "category" drop constraint if exists "category_logo_img_url_check";');
    this.addSql('alter table "category" alter column "logo_img_url" drop default;');
    this.addSql('alter table "category" alter column "logo_img_url" type varchar(255) using ("logo_img_url"::varchar(255));');
    this.addSql('alter table "category" drop constraint if exists "category_banner_img_url_check";');
    this.addSql('alter table "category" alter column "banner_img_url" drop default;');
    this.addSql('alter table "category" alter column "banner_img_url" type varchar(255) using ("banner_img_url"::varchar(255));');
    this.addSql('alter table "category" drop constraint "category_name_unique";');

    this.addSql('alter table "post" drop constraint if exists "post_title_check";');
    this.addSql('alter table "post" alter column "title" drop default;');
    this.addSql('alter table "post" alter column "title" type varchar(100) using ("title"::varchar(100));');
    this.addSql('alter table "post" drop constraint if exists "post_body_check";');
    this.addSql('alter table "post" alter column "body" drop default;');
    this.addSql('alter table "post" alter column "body" type varchar(15000) using ("body"::varchar(15000));');
    this.addSql('alter table "post" drop constraint if exists "post_is_disabled_check";');
    this.addSql('alter table "post" alter column "is_disabled" drop default;');
    this.addSql('alter table "post" alter column "is_disabled" type boolean using ("is_disabled"::boolean);');

    this.addSql('alter table "comment" drop constraint if exists "comment_body_check";');
    this.addSql('alter table "comment" alter column "body" drop default;');
    this.addSql('alter table "comment" alter column "body" type varchar(3000) using ("body"::varchar(3000));');
    this.addSql('alter table "comment" drop constraint if exists "comment_is_disabled_check";');
    this.addSql('alter table "comment" alter column "is_disabled" drop default;');
    this.addSql('alter table "comment" alter column "is_disabled" type boolean using ("is_disabled"::boolean);');
  }

  async down(): Promise<void> {
    this.addSql('alter table "category" drop constraint if exists "category_description_check";');
    this.addSql('alter table "category" alter column "description" type varchar using ("description"::varchar);');
    this.addSql('alter table "category" alter column "description" set default \'\';');
    this.addSql('alter table "category" drop constraint if exists "category_is_disabled_check";');
    this.addSql('alter table "category" alter column "is_disabled" type bool using ("is_disabled"::bool);');
    this.addSql('alter table "category" alter column "is_disabled" set default false;');
    this.addSql('alter table "category" drop constraint if exists "category_logo_img_url_check";');
    this.addSql('alter table "category" alter column "logo_img_url" type varchar using ("logo_img_url"::varchar);');
    this.addSql('alter table "category" alter column "logo_img_url" set default \'https://i.imgur.com/OQENGf1.jpeg\';');
    this.addSql('alter table "category" drop constraint if exists "category_banner_img_url_check";');
    this.addSql('alter table "category" alter column "banner_img_url" type varchar using ("banner_img_url"::varchar);');
    this.addSql('alter table "category" alter column "banner_img_url" set default \'https://i.imgur.com/OQENGf1.jpeg\';');
    this.addSql('alter table "category" add constraint "category_name_unique" unique ("name");');

    this.addSql('alter table "comment" drop constraint if exists "comment_body_check";');
    this.addSql('alter table "comment" alter column "body" type varchar using ("body"::varchar);');
    this.addSql('alter table "comment" alter column "body" set default \'\';');
    this.addSql('alter table "comment" drop constraint if exists "comment_is_disabled_check";');
    this.addSql('alter table "comment" alter column "is_disabled" type bool using ("is_disabled"::bool);');
    this.addSql('alter table "comment" alter column "is_disabled" set default false;');

    this.addSql('alter table "post" drop constraint if exists "post_title_check";');
    this.addSql('alter table "post" alter column "title" type varchar using ("title"::varchar);');
    this.addSql('alter table "post" alter column "title" set default \'\';');
    this.addSql('alter table "post" drop constraint if exists "post_body_check";');
    this.addSql('alter table "post" alter column "body" type varchar using ("body"::varchar);');
    this.addSql('alter table "post" alter column "body" set default \'\';');
    this.addSql('alter table "post" drop constraint if exists "post_is_disabled_check";');
    this.addSql('alter table "post" alter column "is_disabled" type bool using ("is_disabled"::bool);');
    this.addSql('alter table "post" alter column "is_disabled" set default false;');

    this.addSql('alter table "user" drop constraint if exists "user_is_disabled_check";');
    this.addSql('alter table "user" alter column "is_disabled" type bool using ("is_disabled"::bool);');
    this.addSql('alter table "user" alter column "is_disabled" set default false;');
    this.addSql('alter table "user" drop constraint if exists "user_profile_img_url_check";');
    this.addSql('alter table "user" alter column "profile_img_url" type varchar using ("profile_img_url"::varchar);');
    this.addSql('alter table "user" alter column "profile_img_url" set default \'https://i.imgur.com/OQENGf1.jpeg\';');
  }

}
