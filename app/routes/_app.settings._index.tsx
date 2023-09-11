import { json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useFormAction,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";

import { db } from "~/utils/db.server";
import { firstNameSchema, lastNameSchema } from "~/shared/schema/user";
import { useDebounce } from "~/utils/useDebounce";
import { authenticate } from "~/utils/auth.server";
import { Input } from "~/components/Input";

export const loader = async ({ request }: LoaderArgs) => {
  const { user } = await authenticate(request);

  if (!user) throw json({ message: "Something Went wrong!" });

  return { user };
};

export const action = async ({ request }: ActionArgs) => {
  const { user } = await authenticate(request);

  const formData = await request.formData();

  const body = Object.fromEntries(formData);

  const firstNameParseResult = firstNameSchema.safeParse(body.firstName);
  const lastNameParseResult = lastNameSchema.safeParse(body.lastNa);

  if (!firstNameParseResult.success) {
    return json(firstNameParseResult.error.flatten().formErrors, {
      status: 400,
    });
  }

  if (!lastNameParseResult.success) {
    return json(lastNameParseResult.error.flatten().formErrors, {
      status: 400,
    });
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      firstName: firstNameParseResult.data,
      lastName: lastNameParseResult.data,
    },
  });

  return new Response(undefined, { status: 200 });
};

const GeneralSettings = () => {
  const navigation = useNavigation();
  const { user } = useLoaderData<typeof loader>();
  const errors = useActionData<typeof action>();
  const formAction = useFormAction(".");

  const isSaving = useDebounce({
    value: navigation.state !== "idle" && navigation.formAction === formAction,
    time: 500,
    unless: true,
  });

  return (
    <section>
      <Form method="POST" className="space-y-3">
        <div className="space-y-1">
          <label className="min-w-[80px]" htmlFor="firstName">
            First name:
          </label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={user.firstName}
            autoComplete="given-name"
            className="max-w-sm w-full bg-slate-50/70 disabled:bg-slate-50/50 disabled:text-gray-600/50"
          />
          <p className="mt-1 text-rose-500 text-sm font-medium">
            &nbsp;{errors?.[0]}
          </p>
        </div>
        <div className="space-y-1">
          <label className="min-w-[80px]" htmlFor="lastName">
            Last name:
          </label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={user.lastName}
            autoComplete="lastName"
            className="max-w-sm w-full bg-slate-50/70 disabled:bg-slate-50/50 disabled:text-gray-600/50"
          />
          <p className="mt-1 text-rose-500 text-sm font-medium">
            &nbsp;{errors?.[0]}
          </p>
        </div>
        <div className="space-y-1">
          <label className="min-w-[80px]">Email:</label>
          <Input
            name="email"
            defaultValue={user.email}
            className="max-w-sm w-full bg-slate-50/70 disabled:bg-slate-50/50 disabled:text-gray-950/50 placeholder:select-none pointer-events-none"
            disabled
            readOnly
          />
          <p className="text-slate-950/60 text-sm">
            Changing your email address currently is not supported.
          </p>
        </div>
        <button className="px-5 py-2 bg-emerald-950 rounded-lg self-center text-white font-medium">
          {isSaving ? "Saving..." : "Save"}
        </button>
      </Form>
    </section>
  );
};

export default GeneralSettings;
