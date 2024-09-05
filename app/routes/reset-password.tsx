import {
  Form,
  json,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@vercel/remix";
import classNames from "classnames";
import { Carousel } from "~/components/Carousel";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { getRandomHash } from "~/utils/crypto.server";
import { db } from "~/utils/db.server";
import {
  sendPasswordChangedEmail,
  sendResetPasswordEmail,
} from "~/utils/email.server";
import { encryptPassword } from "~/utils/password.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) throw redirect("/");

  const forgotPassword = await db.forgetPassword.findFirst({
    where: { verificationCode: code },
  });

  if (!forgotPassword) throw redirect("/");

  return { verificationCode: forgotPassword.verificationCode };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData();

    const password = String(formData.get("password"));
    const verificationCode = String(formData.get("verificationCode"));

    const forgotPassword = await db.forgetPassword.findFirst({
      where: { verificationCode, isVerified: false },
    });

    if (!forgotPassword) throw redirect("/");

    const user = await db.user.update({
      where: { email: forgotPassword.email },
      data: { password: encryptPassword(password) },
    });

    await db.forgetPassword.update({
      where: { id: forgotPassword.id },
      data: { isVerified: true },
    });

    await sendPasswordChangedEmail({
      name: user.firstName,
      to: user.email,
    });

    throw redirect("/login");
  } catch (error) {
    if (error instanceof Response) throw error;
    console.log("Failed to send email");
    console.log(error);
    return json(false, { status: 500 });
  }
};

export default function ForgotPassword() {
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const { verificationCode } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen grid grid-cols-2 gap-2">
      <Carousel message="Sign in with Passkeys if you already have one, or sign in with your password and create one." />
      <div className="flex flex-col items-center px-4 sm:px-0 col-span-2 md:col-span-1">
        <Form
          method="POST"
          className={classNames(
            "flex flex-col gap-5 w-full max-w-lg p-4 rounded-md sm:my-auto"
          )}
        >
          <div>
            <h1 className="font-bold text-2xl">Hey 👋</h1>
            <p className="text-slate-500 mt-4">
              Create a new and strong password, use a password manager if you
              can!
            </p>
          </div>
          <input
            type="hidden"
            name="verificationCode"
            value={verificationCode}
          />
          {actionData === false && (
            <p className="px-4 py-2 bg-red-500/20 rounded-lg text-red-950">
              Something went wrong while changing your password, please try
              again later or contact us.
            </p>
          )}
          <div className="mt-6">
            <div className="flex flex-col gap-1">
              <label className="w-32" htmlFor="password">
                New password:
              </label>
              <Input
                type="password"
                name="password"
                id="password"
                className="h-11"
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button className="mt-6 py-6" disabled={navigation.state !== "idle"}>
            Reset Password
          </Button>
        </Form>
      </div>
    </div>
  );
}
