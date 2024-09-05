import {
  Form,
  json,
  Link,
  useActionData,
  useNavigation,
} from "@remix-run/react";
import type { ActionFunctionArgs } from "@vercel/remix";
import classNames from "classnames";
import { Carousel } from "~/components/Carousel";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { getRandomHash } from "~/utils/crypto.server";
import { db } from "~/utils/db.server";
import { sendResetPasswordEmail } from "~/utils/email.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData();

    const email = String(formData.get("email"));

    const user = await db.user.findUnique({ where: { email } });
    if (user === null) {
      // We don't tell them if they have account or not, but we skip sending any email
      // if the user for that email doesn't exist

      return true;
    }

    const verificationCode = getRandomHash(email);

    await db.forgetPassword.create({
      data: { email, verificationCode },
    });

    await sendResetPasswordEmail({
      to: email,
      code: verificationCode,
    });
    return true;
  } catch (error) {
    console.log("Failed to send email");
    console.log(error);
    return json(false, { status: 500 });
  }
};

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

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
              Let's help you get your account back, shall we!
            </p>
          </div>
          {actionData === true && (
            <p className="px-4 py-2 bg-emerald-500/20 rounded-lg text-emerald-950">
              Check your email, you should've received an email if an account is
              linked to the email you provided.
            </p>
          )}
          {actionData === false && (
            <p className="px-4 py-2 bg-red-500/20 rounded-lg text-red-950">
              Something went wrong while sending you an email, please try again
              later.
            </p>
          )}
          <div className="mt-6">
            <div className="flex flex-col gap-1">
              <label className="w-20" htmlFor="email">
                Email:
              </label>
              <Input
                type="email"
                name="email"
                id="email"
                placeholder="pasha@soran.mir"
                className="h-11"
                autoComplete="email username"
              />
            </div>
          </div>
          <Button className="mt-6 py-6" disabled={navigation.state !== "idle"}>
            Send Recovery Email
          </Button>
          <p className="text-center mt-4">
            Remembered your password?
            <Link className="ms-2 p-2 rounded-lg" to="/login">
              Login
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
}
