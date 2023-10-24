import { redirect } from "@vercel/remix";

import { db } from "./db.server";
import { tokenCookie, twoFactorAuthCookie } from "./token.server";

export const authenticate = async (
  request: Request,
  {
    check2FA = true,
    withPassword = undefined,
    withChallenge = undefined,
    withOtpSecret = undefined,
    withOtpVerified = undefined,
    withOtpAuthUrl = undefined,
    withOtpEnabled = undefined,
  }: {
    check2FA?: boolean;
    withPassword?: true;
    withChallenge?: true;
    withOtpSecret?: true;
    withOtpVerified?: true;
    withOtpAuthUrl?: true;
    withOtpEnabled?: true;
  } = {}
) => {
  const cookieHeader = request.headers.get("Cookie");
  const id = await tokenCookie.parse(cookieHeader);

  if (!id) throw redirect("/login");

  if (check2FA) {
    const is2FAed = await twoFactorAuthCookie.parse(cookieHeader);

    if (!is2FAed) throw redirect("/login/verify");
  }

  // FIXME make sure `password` is not included in resulting type
  // if the resulting expression type is true
  const user = await db.user.findUnique({
    where: { id, isVerified: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      password: withPassword === true,
      currentChallenge: withChallenge === true,
      otp_hex: withOtpSecret === true,
      otp_verified: withOtpVerified === true,
      otp_auth_url: withOtpAuthUrl === true,
      otp_enabled: withOtpEnabled === true,
    },
  });

  if (user === null) {
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      await tokenCookie.serialize(null, {
        expires: new Date(0),
        maxAge: undefined,
      })
    );
    throw redirect("/login", { headers });
  }

  return { user };
};
