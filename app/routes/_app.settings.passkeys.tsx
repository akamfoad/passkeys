import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  SerializeFrom,
} from "@vercel/remix";
import {
  Form,
  Link,
  useFormAction,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { ZodError, z } from "zod";
import { format } from "date-fns";
import classNames from "classnames";
import { json } from "@vercel/remix";
import { useEffect, useState } from "react";
import type { Authenticator } from "@prisma/client";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";

import Trash from "~/icons/Trash";
import { Icon } from "~/icons/App";
import { PencilIcon } from "~/icons/Pencil";
import { Spinner } from "~/components/Spinner";

import { db } from "~/utils/db.server";
import { authenticate } from "~/utils/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

type Passkey = Pick<
  Authenticator,
  "id" | "name" | "credentialBackedUp" | "createdAt" | "lastUsedAt"
>;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { user } = await authenticate(request);

  const authenticators: Passkey[] = await db.authenticator.findMany({
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

type SerializedPasskeys = SerializeFrom<Passkey>;

const DeletePasskeySchema = z
  .object({
    id: z.string().nonempty("Incorrect ID provided"),
  })
  .required();

const RenamePasskeySchema = z
  .object({
    id: z.string().nonempty("Passkey ID is required"),
    passkeyName: z.string().nonempty("Passkey name is required"),
  })
  .required();

const handlePasskeyDelete = async (request: Request, userId: number) => {
  try {
    const formData = await request.formData();
    const { id } = DeletePasskeySchema.parse(Object.fromEntries(formData));
    await db.authenticator.delete({ where: { id, userId } });

    return new Response(undefined, { status: 204 });
  } catch (error) {
    if (error instanceof ZodError) {
      return json({ errors: error.flatten().fieldErrors }, { status: 400 });
    }

    throw json({ message: "Something went wrong" }, { status: 500 });
  }
};

const handlePasskeyRename = async (request: Request, userId: number) => {
  try {
    const formData = await request.formData();
    const { id, passkeyName } = RenamePasskeySchema.parse(
      Object.fromEntries(formData)
    );
    await db.authenticator.update({
      where: { id, userId },
      data: { name: passkeyName },
    });

    return new Response(undefined, { status: 204 });
  } catch (error) {
    if (error instanceof ZodError) {
      return json({ errors: error.flatten().fieldErrors }, { status: 400 });
    }

    throw json({ message: "Something went wrong" }, { status: 500 });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { user } = await authenticate(request);
  switch (request.method.toUpperCase()) {
    case "DELETE":
      return handlePasskeyDelete(request, user.id);
    case "POST":
      return handlePasskeyRename(request, user.id);
    default:
      throw json({ message: "Method not allowed" }, { status: 405 });
  }
};

const PasskeysSettings = () => {
  const { passkeys } = useLoaderData<typeof loader>();

  const [isPasskeySupported, setIsPasskeySupported] = useState(true);

  useEffect(() => {
    setIsPasskeySupported(browserSupportsWebAuthn());
  }, []);

  return (
    <section>
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-lg font-medium">Your Passkeys</h1>
        {isPasskeySupported && (
          <Button asChild>
            <Link className="px-5 py-2" to="add-passkey">
              Add a passkey
            </Link>
          </Button>
        )}
      </header>
      {!isPasskeySupported && (
        <p className="my-4">Your browser doesn't support Passkeys :(</p>
      )}
      {Array.isArray(passkeys) && (
        <ul className="flex flex-col gap-5">
          {passkeys.map(
            ({ id, name, createdAt, lastUsedAt, credentialBackedUp }) => {
              return (
                <Passkey
                  key={id}
                  id={id}
                  name={name}
                  credentialBackedUp={credentialBackedUp}
                  createdAt={createdAt}
                  lastUsedAt={lastUsedAt}
                />
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

const Passkey = ({
  id,
  name,
  credentialBackedUp,
  createdAt,
  lastUsedAt,
}: SerializedPasskeys) => {
  const navigation = useNavigation();
  const formAction = useFormAction();
  const [isEditing, setIsEditing] = useState(false);

  const isSubmitting =
    navigation.state !== "idle" &&
    navigation.formAction === formAction &&
    navigation.formData?.get("id") === id;

  const isDeleting = isSubmitting && navigation.formMethod === "DELETE";

  const isRenaming = isSubmitting && navigation.formMethod === "POST";

  let passkeyName = name;

  if (isRenaming) {
    passkeyName = navigation.formData?.get("passkeyName") as string;
  }

  return (
    <li
      key={id}
      className="flex flex-wrap gap-8 justify-between lg:items-center border border-slate-500/50 px-5 py-3 rounded-lg"
    >
      <div className="flex gap-4 items-center">
        <div className="text-slate-700">
          <Icon height={24} />
        </div>
        <div>
          {isEditing && !isRenaming ? (
            <Form
              method="POST"
              encType="multipart/form-data"
              className="flex items-center gap-2"
              onSubmit={() => setIsEditing(false)}
            >
              <input type="hidden" name="id" value={id} />
              <Input
                required
                name="passkeyName"
                defaultValue={name || ""}
                className="text-base max-w-sm w-full h-auto px-1.5 py-0.5"
                autoFocus
              />
              <div className="flex items-center gap-2 min-w-fit">
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="px-2 py-1 h-auto text-sm border-zinc-400 bg-transparent"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  className="font-normal px-2 py-1 h-auto text-sm"
                >
                  Cancel
                </Button>
              </div>
            </Form>
          ) : (
            <h2 className="h-7 pb-1">
              <span className="font-medium">{passkeyName}</span>
              {credentialBackedUp && (
                <span className="ms-2 text-xs font-li px-1.5 py-1 rounded-full bg-sky-500/20 text-sky-950">
                  Synced
                </span>
              )}
            </h2>
          )}
          <p className="text-sm font-light text-slate-800 mt-2">
            <span>
              Added on {format(new Date(createdAt), "MMM d, hh:mm a")}
            </span>
            {lastUsedAt && (
              <span>
                {" "}
                | Last used {format(new Date(createdAt), "MMM d, hh:mm a")}
              </span>
            )}
          </p>
        </div>
      </div>
      <Form
        method="DELETE"
        encType="multipart/form-data"
        className={classNames("flex items-center gap-2", {
          hidden: isEditing,
        })}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={classNames(
            "w-8 h-8 flex items-center justify-center text-sm font-light bg-gray-300/50  border border-gray-900/50 p-1.5 rounded-md",
            "hover:bg-gray-300 transition-colors"
          )}
        >
          <PencilIcon height={18} />
        </button>
        <button
          className={classNames(
            "w-8 h-8 flex items-center justify-center text-sm font-light bg-gray-300/50  border border-gray-900/50  text-rose-600 p-1.5 rounded-md",
            "hover:bg-rose-700 hover:text-white hover:border-transparent transition-colors"
          )}
        >
          {isDeleting ? <Spinner /> : <Trash height={18} />}
        </button>
      </Form>
    </li>
  );
};
