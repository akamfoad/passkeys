import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
import type { ActionArgs } from "@remix-run/node";

import { db } from "~/utils/db.server";
import { SignupSchema } from "~/shared/schema/auth";
import { getRandomHash } from "~/utils/crypto.server";
import { encryptPassword } from "~/utils/password.server";
import { sendVerificationEmail } from "~/utils/email.server";

export const action = async ({ request }: ActionArgs) => {
  const requestData = await request.formData();
  const parseResult = SignupSchema.safeParse(Object.fromEntries(requestData));

  if (!parseResult.success) {
    return json(parseResult.error.flatten().fieldErrors, { status: 400 });
  }

  const count = await db.user.count({
    where: { email: parseResult.data.email },
  });

  if (count !== 0) {
    return json(
      { email: ["A user with this email already exists!"] },
      { status: 400 }
    );
  }

  const hashedPassword = encryptPassword(parseResult.data.password);
  const verificationCode = getRandomHash(parseResult.data.email);

  const { name, email } = await db.user.create({
    data: {
      verificationCode,
      password: hashedPassword,
      name: parseResult.data.name,
      email: parseResult.data.email,
    },
  });

  try {
    await sendVerificationEmail({ name, to: email, code: verificationCode });
  } catch (error) {
    console.log("Failed to send email");
    console.log(error);
    throw json(null, { status: 500 });
  }

  const searchParams = new URLSearchParams();
  searchParams.set("name", name);
  searchParams.set("email", email);

  throw redirect(`/verify?${searchParams.toString()}`);
};

const Signup = () => {
  const errors = useActionData<typeof action>();

  return (
    <div className="flex justify-center items-center">
      <Form
        method="POST"
        className="flex flex-col gap-4 mt-6 bg-slate-100 w-full max-w-lg p-4 rounded-md"
      >
        <div>
          <div className="flex items-center gap-6">
            <label className="w-20" htmlFor="name">
              Full name:
            </label>
            <input
              type="name"
              name="name"
              id="name"
              className="rounded-md bg-white block p-2 flex-1"
              autoComplete="name"
            />
          </div>
          <p className="ms-24 ps-1 mt-1 text-rose-500 text-sm font-medium">&nbsp;{errors?.name?.[0]}</p>
        </div>
        <div>
          <div className="flex items-center gap-6">
            <label className="w-20" htmlFor="email">
              Email:
            </label>
            <input
              type="email"
              name="email"
              id="email"
              className="rounded-md bg-white block p-2 flex-1"
              autoComplete="email"
            />
          </div>
          <p className="ms-24 ps-1 mt-1 text-rose-500 text-sm font-medium">&nbsp;{errors?.email?.[0]}</p>
        </div>
        <div>
          <div className="flex items-center gap-6">
            <label className="w-20" htmlFor="password">
              Password:
            </label>
            <input
              type="password"
              name="password"
              id="password"
              className="rounded-md bg-white block p-2 flex-1"
              autoComplete="new-password"
            />
          </div>
          <p className="ms-24 ps-1 mt-1 text-rose-500 text-sm font-medium">&nbsp;{errors?.password?.[0]}</p>
        </div>
        <button className="px-5 py-2 bg-emerald-700 rounded-lg self-center text-white font-medium">
          Sign up
        </button>
        <Link className="self-center px-5 py-2 rounded-lg" to="/login">
          login
        </Link>
      </Form>
    </div>
  );
};

export default Signup;
