import { z } from "zod";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import type { ActionArgs } from "@remix-run/node";

import { db } from "~/utils/db.server";
import { encryptPassword } from "~/utils/password.server";
import { sendVerificationEmail } from "~/utils/email.server";
import { getRandomHash } from "~/utils/crypto.server";

const SignupSchema = z
  .object({
    email: z
      .string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string",
      })
      .email("Please provide a correct email address"),
    name: z
      .string({
        required_error: "Full name is required",
        invalid_type_error: "Full name must be a string",
      })
      .min(4, "Full name must be at least 4 characters")
      .max(255, "Full name must be at most 255 characters"),
    password: z
      .string({
        required_error: "Password is required",
        invalid_type_error: "Password must be a string",
      })
      .min(10, "Password must be at least 10 characters")
      .max(255, "Password must be at most 255 characters"),
  })
  .required();

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
        className="flex flex-col gap-4 bg-slate-100 w-full max-w-lg p-4 rounded-md"
      >
        <div>
          <label htmlFor="name">Full name:</label>
          <input
            type="name"
            name="name"
            id="name"
            className="rounded-md bg-white block"
          />
          <p>&nbsp;{errors?.name?.[0]}</p>
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            name="email"
            id="email"
            className="rounded-md bg-white block"
          />
          <p>&nbsp;{errors?.email?.[0]}</p>
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            name="password"
            id="password"
            className="rounded-md bg-white block"
          />
          <p>&nbsp;{errors?.password?.[0]}</p>
        </div>
        <button className="px-5 py-2 bg-emerald-700 rounded-lg self-center text-white font-medium">
          Signup
        </button>
      </Form>
    </div>
  );
};

export default Signup;
