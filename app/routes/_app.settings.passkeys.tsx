import { useEffect, useState } from "react";
import { Link, useLoaderData } from "@remix-run/react";
import { json, type LoaderArgs } from "@remix-run/node";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { authenticate } from "~/utils/auth.server";
import { db } from "~/utils/db.server";

export const loader = async ({ request }: LoaderArgs) => {
  const { user } = await authenticate(request);

  // FIXME add name, createdAt and last used
  // Also if possible see if the passkey
  // Also add support for changing name, and also
  // deleting the passkey
  const authenticators = await db.authenticator.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, credentialBackedUp: true },
  });

  console.log(authenticators);
  return json({ passkeys: authenticators });
};

const PasskeysSettings = () => {
  const { passkeys } = useLoaderData<typeof loader>();

  const [isPasskeySupported, setIsPasskeySupported] = useState(
    typeof navigator === "undefined" ? false : browserSupportsWebAuthn()
  );

  useEffect(() => {
    setIsPasskeySupported(browserSupportsWebAuthn());
  }, []);

  return (
    <section>
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-lg font-medium">Your Passkeys</h1>
        {isPasskeySupported && (
          <Link
            className="px-5 py-2 bg-emerald-700 rounded-lg self-center text-white font-medium"
            to="add-passkey"
          >
            Add a passkey
          </Link>
        )}
      </header>
      {Array.isArray(passkeys) && (
        <ul>
          {passkeys.map(({ id, name, credentialBackedUp }) => (
            <li key={id}>
              <h2>Name: {name}</h2>
              <div>Id: {id}</div>
              <p>{credentialBackedUp ? "Backedup" : "Not backedup"}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default PasskeysSettings;
