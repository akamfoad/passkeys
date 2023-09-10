import { redirect } from "@remix-run/node";
import { tokenCookie } from "./token.server";
import { db } from "./db.server";

export const authenticate = async (
  request: Request,
  {
    withPassword = undefined,
    withChallenge = undefined,
    withOtpSecret = undefined,
    withOtpVerified = undefined,
    withOtpAuthUrl = undefined,
    withOtpEnabled = undefined
  }: {
    withPassword?: true;
    withChallenge?: true;
    withOtpSecret?: true;
    withOtpVerified?: true;
    withOtpAuthUrl?: true;
    withOtpEnabled?: true;
  } = {}
) => {
  const id = await tokenCookie.parse(request.headers.get("Cookie"));

  if (!id) throw redirect("/login");

  // FIXME make sure `password` is not included in resulting type
  // if the resulting expression type is true
  const user = await db.user.findUnique({
    where: { id, isVerified: true },
    select: {
      id: true,
      name: true,
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
