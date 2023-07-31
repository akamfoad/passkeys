import { json, type ActionArgs } from "@remix-run/node";
import { Link, useFetcher, useSearchParams } from "@remix-run/react";
import { z } from "zod";
import { getRandomHash } from "~/utils/crypto.server";
import { db } from "~/utils/db.server";
import { sendVerificationEmail } from "~/utils/email.server";

export const action = async ({ request }: ActionArgs) => {
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
  const { name } = await db.user.update({
    where: { email },
    data: { verificationCode },
  });

  try {
    await sendVerificationEmail({ name, to: email, code: verificationCode });
  } catch (error) {
    console.log("Failed to send email");
    console.log(error);
    throw json(null, { status: 500 });
  }


  return { success: true };
};

export const loader = () => {
  // FIXME check if email is in params, if so check if user exists
  // and show different messages based on that
  return null;
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
