import { json, type ActionArgs } from "@remix-run/node";
import { rpID, type Authenticator, rpOrigin } from "~/utils/passkeys.server";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

import { db } from "~/utils/db.server";
import { tokenCookie, twoFactorAuthCookie } from "~/utils/token.server";

export const loader = async () => {
  const options = await generateAuthenticationOptions({
    userVerification: "preferred",
  });

  return { options };
};

export const action = async ({ request }: ActionArgs) => {
  const { asseResp: body, challenge: expectedChallenge } = await request.json();
  if (!body.id) {
    return json(
      { error: `'id' is required, ${body.id} was provided` },
      { status: 400 }
    );
  }
  const authenticator = (await db.authenticator.findUnique({
    where: { credentialID: body.id },
  })) as unknown as Authenticator;

  if (!authenticator) {
    throw json(
      {
        message:
          "Couldn't find any match for the provided passkey, make sure to use a passkey connected to your account.",
      },
      { status: 401 }
    );
  }

  let verification;

  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpID,
      authenticator,
    });
  } catch (error) {
    console.error(error);
    return json({ error: (error as Error).message }, { status: 400 });
  }

  const { verified, authenticationInfo } = verification;

  if (verified && authenticationInfo !== undefined) {
    const { userId } = await db.authenticator.update({
      where: { credentialID: body.id },
      data: { counter: authenticationInfo.newCounter },
      select: { userId: true },
    });

    const headers = new Headers();
    headers.append("Set-Cookie", await tokenCookie.serialize(userId));
    headers.append("Set-Cookie", await twoFactorAuthCookie.serialize(true));

    return json({ verified }, { headers });
  }

  return json({ message: "Something went wrong" }, { status: 500 });
};
