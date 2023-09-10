import { redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import type { LoaderArgs, ActionArgs } from "@remix-run/node";

import { db } from "~/utils/db.server";
import { authenticate } from "~/utils/auth.server";
import { getOTP, getRandomHexSecret } from "~/utils/otp.server";

export const loader = async ({ request }: LoaderArgs) => {
  const { user } = await authenticate(request, { withOtpEnabled: true });

  if (user.otp_enabled === true) {
    return redirect("/settings/security");
  }

  return new Response(undefined);
};

export const action = async ({ request }: ActionArgs) => {
  const { user } = await authenticate(request);

  const hexSecret = getRandomHexSecret();

  const TOTP = getOTP(user.email, hexSecret);

  const otpAuthUrl = TOTP.toString();

  try {
    await db.user.update({
      where: { id: user.id },
      data: { otp_auth_url: otpAuthUrl, otp_hex: hexSecret },
    });

    return redirect("/settings/security/verify-2fa");
  } catch {
    return new Response(undefined, { status: 500 });
  }
};

const Enable2FA = () => {
  return (
    <section>
      <h1 className="text-xl font-medium mb-1">
        Enable 2 Factor Authentication
      </h1>
      <p className="mt-4 max-w-lg tracking-wide">
        You'll be asked to provide a 6-digit code from a previously setup
        Authenticator app like Google Authenticator or Authy.
      </p>
      <p className="mt-4 max-w-lg tracking-wide">Are you ready to setup 2FA?</p>
      <Form method="POST" className="mt-4">
        <input type="hidden" name="nothing" value="nothing" />
        <button className="px-5 py-2 bg-emerald-950 rounded-lg self-center text-white font-medium">
          Enable
        </button>
      </Form>
    </section>
  );
};
export default Enable2FA;
