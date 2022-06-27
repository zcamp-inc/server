import { v4 } from "uuid"
export const __prod__ = process.env.NODE_ENV === 'production' ;
export const COOKIE_NAME = "redis_cookie";
export const FORGET_PASSWORD_PREFIX = 'forget-password: '
const token = v4();
export const HTML_LINK = `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
