import { createCookie } from "@remix-run/node";

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
const COOKIE_SECRET = process.env.COOKIE_SECRET;

if (
  typeof COOKIE_DOMAIN !== "string" &&
  process.env.NODE_ENV === "production"
) {
  throw new Error(
    `Expected COOKIE_DOMAIN to be a string, instead go ${COOKIE_DOMAIN}`
  );
}

if (typeof COOKIE_SECRET !== "string") {
  throw new Error(
    `Expected COOKIE_SECRET to be a string, instead go ${COOKIE_SECRET}`
  );
}

export const tokenCookie = createCookie("access_token", {
  path: "/",
  maxAge: 86400,
  sameSite: "strict",
  domain: COOKIE_DOMAIN,
  secrets: [COOKIE_SECRET],
  secure: process.env.NODE_ENV === "production",
});

export const twoFactorAuthCookie = createCookie("2fa_token", {
  path: "/",
  maxAge: 86400,
  sameSite: "strict",
  domain: COOKIE_DOMAIN,
  secrets: [COOKIE_SECRET],
  secure: process.env.NODE_ENV === "production",
});