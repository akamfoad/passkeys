import { json, type ActionArgs, type LoaderArgs } from "@remix-run/node";
import { rpID, type Authenticator, rpOrigin } from "~/utils/passkeys.server";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

import { db } from "~/utils/db.server";
import { authenticate } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderArgs) => {
  const { user } = await authenticate(request);

  const userAuthenticators = (await db.authenticator.findMany({
    where: { userId: user.id },
  })) as unknown as Authenticator[];

  const options = generateAuthenticationOptions({
    // Require users to use a previously-registered authenticator
    allowCredentials: userAuthenticators.map((authenticator) => ({
      id: authenticator.credentialID,
      type: "public-key",
      // Optional
      transports: authenticator.transports,
    })),
    userVerification: "preferred",
  });

  await db.user.update({
    where: { id: user.id },
    data: { currentChallenge: options.challenge },
  });

  return { options };
};

export const action = async ({ request }: ActionArgs) => {
  const { user } = await authenticate(request, { withChallenge: true });

  const body = await request.json();

  // should match the `id` in the returned credential
  //   const authenticator = getUserAuthenticator(user, body.id);
  const authenticator = (await db.authenticator.findUnique({
    where: { id: body.id, userId: user.id },
  })) as unknown as Authenticator;

  if (!authenticator) {
    throw new Error(
      `Could not find authenticator ${body.id} for user ${user.id}`
    );
  }

  let verification;

  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: user.currentChallenge as string,
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
    await db.authenticator.update({
      where: { id: body.id },
      data: { counter: authenticationInfo.newCounter },
    });
  }

  return { verified };
};
