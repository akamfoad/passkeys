import classNames from "classnames";
import { json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useFormAction,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import type { ClassAttributes, InputHTMLAttributes } from "react";

import { db } from "~/utils/db.server";
import { nameSchema } from "~/shared/schema/user";
import { useDebounce } from "~/utils/useDebounce";
import { authenticate } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderArgs) => {
  const { user } = await authenticate(request);

  if (!user) throw json({ message: "Something Went wrong!" });

  return { user };
};

export const action = async ({ request }: ActionArgs) => {
  const { user } = await authenticate(request);

  const formData = await request.formData();

  const parseResult = nameSchema.safeParse(Object.fromEntries(formData).name);

  if (!parseResult.success) {
    return json(parseResult.error.flatten().formErrors, { status: 400 });
  }

  await db.user.update({
    where: { id: user.id },
    data: { name: parseResult.data },
  });

  return new Response(undefined, { status: 200 });
};

const Input = (
  props: JSX.IntrinsicAttributes &
    ClassAttributes<HTMLInputElement> &
    InputHTMLAttributes<HTMLInputElement>
) => (
  <input
    {...props}
    className={classNames("rounded-md bg-white block p-2", props.className)}
  />
);

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
      <Form method="POST" className="space-y-10">
        <div className="space-y-1">
          <label className="min-w-[80px]">Full name:</label>
          <Input
            name="name"
            defaultValue={user.name}
            className="w-full lg:w-1/3  bg-slate-50/70 disabled:bg-slate-50/50 disabled:text-gray-600/50"
            autoComplete="name"
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
            className="w-full lg:w-1/3  bg-slate-50/70 disabled:bg-slate-50/50 disabled:text-gray-600/50 placeholder:select-none pointer-events-none"
            disabled
            readOnly
          />
          <p className="text-slate-950/60 text-sm">
            Changing your email address currently is not supported.
          </p>
        </div>
        <button className="px-5 py-2 bg-emerald-700 rounded-lg self-center text-white font-medium">
          {isSaving ? "Saving..." : "Save"}
        </button>
      </Form>
    </section>
  );
};

export default GeneralSettings;
