import { json, redirect } from "@vercel/remix";
import type { ActionFunctionArgs } from "@vercel/remix";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";

import { Carousel } from "~/components/Carousel";

import { db } from "~/utils/db.server";
import { RegisterSchema } from "~/shared/schema/auth";
import { getRandomHash } from "~/utils/crypto.server";
import { encryptPassword } from "~/utils/password.server";
import { sendVerificationEmail } from "~/utils/email.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export const action = async ({ request }: ActionFunctionArgs) => {
  const requestData = await request.formData();
  const parseResult = RegisterSchema.safeParse(Object.fromEntries(requestData));

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

  const { firstName, lastName, email } = await db.user.create({
    data: {
      verificationCode,
      password: hashedPassword,
      firstName: parseResult.data.firstName,
      lastName: parseResult.data.lastName,
      email: parseResult.data.email,
    },
    select: {
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  const userName = `${firstName} ${lastName}`;

  try {
    await sendVerificationEmail({
      name: userName,
      to: email,
      code: verificationCode,
    });
  } catch (error) {
    console.log("Failed to send email");
    console.log(error);
    throw json(null, { status: 500 });
  }

  const searchParams = new URLSearchParams();
  searchParams.set("name", userName);
  searchParams.set("email", email);

  throw redirect(`/verify?${searchParams.toString()}`);
};

const Register = () => {
  const navigation = useNavigation();
  const errors = useActionData<typeof action>();

  return (
    <div className="min-h-screen grid grid-cols-2 gap-2">
      <Carousel message="The registration process is quick and easy, you'll create an account under 2min." />
      <div className="flex flex-col items-center px-4 sm:px-0 col-span-2 md:col-span-1">
        <Form
          method="POST"
          className="flex flex-col gap-3 sm:my-auto w-full max-w-lg p-4 rounded-md"
        >
          <div>
            <h1 className="font-bold text-2xl">Get Started</h1>
            <p className="text-slate-500 mt-4">Create your account now</p>
          </div>
          <div className="mt-12">
            <div className="flex flex-col gap-0.5">
              <Label className="w-20" htmlFor="firstName">
                First name
              </Label>
              <Input
                required
                id="firstName"
                name="firstName"
                autoComplete="given-name"
              />
            </div>
            <p className="sm:ps-0.5 mt-1 text-rose-500 text-sm font-medium">
              &nbsp;
              {errors !== undefined &&
                "firstName" in errors &&
                Array.isArray(errors.firstName) &&
                errors.firstName[0]}
            </p>
          </div>
          <div>
            <div className="flex flex-col gap-0.5">
              <Label className="w-20" htmlFor="lastName">
                Last name
              </Label>
              <Input
                required
                id="lastName"
                name="lastName"
                autoComplete="family-name"
              />
            </div>
            <p className="sm:ps-0.5 mt-1 text-rose-500 text-sm font-medium">
              &nbsp;
              {errors !== undefined &&
                "lastName" in errors &&
                Array.isArray(errors.lastName) &&
                errors.lastName[0]}
            </p>
          </div>
          <div>
            <div className="flex flex-col gap-0.5">
              <Label className="w-20" htmlFor="email">
                Email
              </Label>
              <Input
                required
                id="email"
                name="email"
                type="email"
                autoComplete="email"
              />
            </div>
            <p className="sm:ps-0.5 mt-1 text-rose-500 text-sm font-medium">
              &nbsp;
              {errors !== undefined &&
                "email" in errors &&
                Array.isArray(errors.email) &&
                errors.email[0]}
            </p>
          </div>
          <div>
            <div className="flex flex-col gap-0.5">
              <Label className="w-20" htmlFor="password">
                Password
              </Label>
              <Input
                required
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
              />
            </div>
            <p className="sm:ps-0.5 mt-1 text-rose-500 text-sm font-medium">
              &nbsp;
              {errors !== undefined &&
                "password" in errors &&
                Array.isArray(errors.password) &&
                errors.password[0]}
            </p>
          </div>
          <Button className="mt-1 py-6" disabled={navigation.state !== "idle"}>
            Register
          </Button>
          <p className="text-center mt-2">
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

export default Register;
