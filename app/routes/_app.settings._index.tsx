import classNames from "classnames";
import { Form, useLoaderData } from "@remix-run/react";
import { json, type LoaderArgs } from "@remix-run/node";
import type { ClassAttributes, InputHTMLAttributes } from "react";

import { authenticate } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderArgs) => {
  const { user } = await authenticate(request);

  if (!user) throw json({ message: "Something Went wrong!" });

  return { user };
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
  const { user } = useLoaderData<typeof loader>();
  return (
    <section>
      <Form method="POST" className="space-y-10">
        <div className="space-y-1">
          <label className="min-w-[80px]">Name:</label>
          <Input
            name="name"
            defaultValue={user.name}
            className="w-full lg:w-1/3  bg-slate-50/70 disabled:bg-slate-50/50 disabled:text-gray-600/50"
            autoComplete="name"
          />
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
      </Form>
    </section>
  );
};

export default GeneralSettings;
