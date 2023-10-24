import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { Buffer } from "node:buffer";
import { json } from "@vercel/remix";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@vercel/remix";

import { db } from "~/utils/db.server";
import { authenticate } from "~/utils/auth.server";
import { base64EncodeURL } from "~/utils/base64.server";
import type { Authenticator } from "~/utils/passkeys.server";
import { rpID, rpName, rpOrigin } from "~/utils/passkeys.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { user } = await authenticate(request);

  const userAuthenticators = (await db.authenticator.findMany({
    where: { userId: user.id },
  })) as unknown as Authenticator[];

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id.toString(),
    userName: user.email,
    userDisplayName: `${user.firstName} ${user.lastName}`,
    // Don't prompt users for additional information about the authenticator
    // (Recommended for smoother UX)
    attestationType: "none",
    // Prevent users from re-registering existing authenticators
    excludeCredentials: userAuthenticators.map((authenticator) => ({
      id: Buffer.from(authenticator.credentialID),
      type: "public-key",
      // Optional
      transports: authenticator.transports || undefined,
    })),
  });

  await db.user.update({
    where: { id: user.id },
    data: { currentChallenge: options.challenge },
  });

  return { options };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { user } = await authenticate(request, { withChallenge: true });

  const { attResp: body, name } = await request.json();

  let verification;

  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: user.currentChallenge as string,
      expectedOrigin: rpOrigin,
      expectedRPID: rpID,
    });
  } catch (error) {
    console.error(error);
    return json({ error: (error as Error).message }, { status: 400 });
  }

  const { verified, registrationInfo } = verification;

  if (verified && registrationInfo !== undefined) {
    const {
      credentialPublicKey,
      credentialID,
      counter,
      credentialBackedUp,
      credentialDeviceType,
    } = registrationInfo;

    await db.authenticator.create({
      data: {
        counter,
        name,
        userId: user.id,
        credentialBackedUp,
        credentialDeviceType,
        credentialPublicKey: Buffer.from(credentialPublicKey),
        credentialID: base64EncodeURL(credentialID),
      },
    });
  }

  return { verified };
};
