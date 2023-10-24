import { json } from "@vercel/remix";
import {
  Form,
  useActionData,
  useFormAction,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs} from "@vercel/remix";

import { Input } from "~/components/Input";

import { db } from "~/utils/db.server";
import { useDebounce } from "~/utils/useDebounce";
import { authenticate } from "~/utils/auth.server";
import { userSettingsSchema } from "~/shared/schema/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { user } = await authenticate(request);

  if (!user) throw json({ message: "Something Went wrong!" });

  return { user };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { user } = await authenticate(request);

  const formData = await request.formData();

  const parseResult = userSettingsSchema.safeParse(
    Object.fromEntries(formData)
  );

  if (!parseResult.success) {
    return json(parseResult.error.flatten().fieldErrors, {
      status: 422,
    });
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      firstName: parseResult.data.firstName,
      lastName: parseResult.data.lastName,
    },
  });

  return json(null, { status: 200 });
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
      <Form method="POST">
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
            &nbsp;{errors?.firstName?.[0]}
          </p>
        </div>
        <div className="space-y-1 mt-3">
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
            &nbsp;{errors?.lastName?.[0]}
          </p>
        </div>
        <div className="space-y-1 mt-3">
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
        <button className="mt-12 px-5 py-2 bg-emerald-950 rounded-lg text-white font-medium">
          {isSaving ? "Saving..." : "Save"}
        </button>
      </Form>
    </section>
  );
};

export default GeneralSettings;
