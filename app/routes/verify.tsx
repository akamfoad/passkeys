import { z } from "zod";
import { json, redirect } from "@vercel/remix";
import { Link, useFetcher, useSearchParams } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@vercel/remix";

import { db } from "~/utils/db.server";
import { tokenCookie } from "~/utils/token.server";
import { getRandomHash } from "~/utils/crypto.server";
import { sendVerificationEmail } from "~/utils/email.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { searchParams } = new URL(request.url);

  const email = searchParams.get("email");
  if (email === null || !z.string().email().safeParse(email).success) {
    return redirect("/");
  }

  const cookieHeader = request.headers.get("Cookie");
  const id = await tokenCookie.parse(cookieHeader);

  if (id) return redirect("/");

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return redirect("/");

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (email === null || !z.string().email().safeParse(email).success) {
    return json(
      { message: "A valid email is required to proceed." },
      { status: 400 }
    );
  }

  const verificationCode = getRandomHash(email);

  // FIXME resend email and set time for last resend
  // if user exists in DB
  const { firstName, lastName } = await db.user.update({
    where: { email },
    data: { verificationCode },
    select: { firstName: true, lastName: true },
  });

  try {
    await sendVerificationEmail({
      name: `${firstName} ${lastName}`,
      to: email,
      code: verificationCode,
    });
  } catch (error) {
    console.log("Failed to send email");
    console.log(error);
    throw json(null, { status: 500 });
  }

  return { success: true };
};

const Verify = () => {
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();

  const name = searchParams.get("name");
  const email = searchParams.get("email");
  return (
    <div>
      <h1>Congratulations {name}!</h1>
      <p>
        You successfully signed up, we sent you a verification email at {email}
      </p>
      <p>
        Already verified? <Link to="/login">Login</Link>
      </p>
      {typeof email === "string" && fetcher.data?.success === undefined && (
        <p>
          {/* TODO in loader check if user exists witht he provided email, if not
           * redirect them to home page or signi, or show them a different thing
           */}
          Didn't receive the email?{" "}
          <fetcher.Form method="POST">
            {/* TODO Save the last time they received so they cannot spam you */}
            <input type="hidden" name="email" value={email} />
            <button disabled={fetcher.state === "submitting"}>
              Resend verification email
              {fetcher.state === "submitting" ? "..." : ""}
            </button>
          </fetcher.Form>
        </p>
      )}
    </div>
  );
};

export default Verify;
