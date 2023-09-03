import { json, redirect } from "@remix-run/node";
import type { ActionArgs } from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";

import { Carausel } from "~/components/Carausel";

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
    <div className="min-h-screen grid grid-cols-2 gap-2">
      <Carausel />
      <div className="flex flex-col items-center px-4 sm:px-0 col-span-2 md:col-span-1">
        <Form
          method="POST"
          className="flex flex-col gap-4 sm:my-auto w-full max-w-lg p-4 rounded-md"
        >
          <div>
            <h1 className="font-bold text-2xl">Get Started</h1>
            <p className="text-slate-500 mt-4">Create your account now</p>
          </div>
          <div className="mt-12">
            <div className="flex flex-col gap-1">
              <label className="w-20" htmlFor="name">
                Full name
              </label>
              <input
                type="name"
                name="name"
                id="name"
                className="rounded-md border border-zinc-300 block p-2 flex-1"
                autoComplete="name"
              />
            </div>
            <p className="sm:ps-0.5 mt-1 text-rose-500 text-sm font-medium">
              &nbsp;{errors?.name?.[0]}
            </p>
          </div>
          <div>
            <div className="flex flex-col gap-1">
              <label className="w-20" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                className="rounded-md border border-zinc-300 block p-2 flex-1"
                autoComplete="email"
              />
            </div>
            <p className="sm:ps-0.5 mt-1 text-rose-500 text-sm font-medium">
              &nbsp;{errors?.email?.[0]}
            </p>
          </div>
          <div>
            <div className="flex flex-col gap-1">
              <label className="w-20" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                className="rounded-md border border-zinc-300 block p-2 flex-1"
                autoComplete="new-password"
              />
            </div>
            <p className="sm:ps-0.5 mt-1 text-rose-500 text-sm font-medium">
              &nbsp;{errors?.password?.[0]}
            </p>
          </div>
          <button className="mt-6 px-5 py-2 bg-emerald-950 rounded-lg text-white font-medium">
            Sign up
          </button>
          <p className="text-center mt-4">
            Already have an account?
            <Link className="ms-2 p-2 rounded-lg" to="/login">
              Login
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
};

export default Signup;
