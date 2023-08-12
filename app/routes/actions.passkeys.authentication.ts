import { json, type ActionArgs } from "@remix-run/node";
import { rpID, type Authenticator, rpOrigin } from "~/utils/passkeys.server";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

import { db } from "~/utils/db.server";
import { tokenCookie } from "~/utils/token.server";

export const loader = async () => {
  const options = generateAuthenticationOptions({
    userVerification: "preferred",
  });

  return { options };
};

export const action = async ({ request }: ActionArgs) => {
  const { asseResp: body, challenge: expectedChallenge } = await request.json();
  const credentialID = (body.id + "=").split("_").join("/");
  const authenticator = (await db.authenticator.findUnique({
    where: { credentialID },
  })) as unknown as Authenticator;

  if (!authenticator) {
    throw json(
      { message: `Could not find authenticator ${body.id}` },
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
    const { id: userId } = await db.authenticator.update({
      where: { credentialID },
      data: { counter: authenticationInfo.newCounter },
      select: { id: true },
    });

    const headers = new Headers();
    headers.append("Set-Cookie", await tokenCookie.serialize(userId));

    return json({ verified }, { headers });
  }

  return json({ message: "Something went wrong" }, { status: 500 });
};
