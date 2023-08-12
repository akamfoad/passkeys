import { format } from "date-fns";
import { ZodError, z } from "zod";
import { json } from "@remix-run/node";
import { useEffect, useState } from "react";
import {
  Form,
  Link,
  useFormAction,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";

import { Icon } from "~/icons/App";
import { db } from "~/utils/db.server";
import { authenticate } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderArgs) => {
  const { user } = await authenticate(request);

  // FIXME add name, createdAt and last used
  // Also if possible see if the passkey
  // Also add support for changing name, and also
  // deleting the passkey
  const authenticators = await db.authenticator.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      credentialBackedUp: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ passkeys: authenticators });
};

const DeletePasskeySchema = z
  .object({
    id: z.string().nonempty("Incorrect ID provided"),
  })
  .required();

export const action = async ({ request }: ActionArgs) => {
  const { user } = await authenticate(request);
  if (request.method.toUpperCase() !== "DELETE") {
    throw json({ message: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const { id } = DeletePasskeySchema.parse(Object.fromEntries(formData));
    await db.authenticator.delete({ where: { id, userId: user.id } });

    return new Response(undefined, { status: 204 });
  } catch (error) {
    if (error instanceof ZodError) {
      return json({ errors: error.flatten().fieldErrors });
    }

    throw json({ message: "Something went wrong" }, { status: 500 });
  }
};

const PasskeysSettings = () => {
  const navigation = useNavigation();
  const { passkeys } = useLoaderData<typeof loader>();
  const formAction = useFormAction();

  const [isPasskeySupported, setIsPasskeySupported] = useState(true);

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
      {!isPasskeySupported && <p>Your browser doesn't support Passkeys :(</p>}
      {Array.isArray(passkeys) && (
        <ul className="flex flex-col gap-5">
          {passkeys.map(
            ({ id, name, createdAt, lastUsedAt, credentialBackedUp }) => {
              const isDeleting =
                navigation.state !== "idle" &&
                navigation.formAction === formAction &&
                navigation.formData?.get("id") === id;
              return (
                <li
                  key={id}
                  className="flex flex-col gap-4 justify-between lg:flex-row lg:items-center border border-slate-500/50 px-5 py-3 rounded-lg"
                >
                  <div className="flex gap-4 items-center">
                    <div className="text-slate-700">
                      <Icon height={24} />
                    </div>
                    <div>
                      <h2>
                        <span className="font-medium">{name}</span>
                        {credentialBackedUp && (
                          <span className="ms-2 text-xs font-li px-1.5 py-1 rounded-full bg-sky-500/20 text-sky-950">
                            Synced
                          </span>
                        )}
                      </h2>
                      <p className="text-sm font-light text-slate-800 mt-2">
                        <span>
                          Added on{" "}
                          {format(new Date(createdAt), "MMM d, hh:mm a")}
                        </span>
                        {lastUsedAt && (
                          <span>
                            {" "}
                            | Last used{" "}
                            {format(new Date(createdAt), "MMM d, hh:mm a")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Form method="DELETE" encType="multipart/form-data">
                    <input type="hidden" name="id" value={id} />
                    <button className="text-sm font-light text-rose-600 px-2 py-1.5 rounded-md">
                      {isDeleting ? "Removing..." : "Remove"}
                    </button>
                  </Form>
                </li>
              );
            }
          )}
        </ul>
      )}
      {Array.isArray(passkeys) && passkeys.length === 0 && (
        <p className="text-amber-900">No passkeys yet, trying creating one!</p>
      )}
    </section>
  );
};

export default PasskeysSettings;
