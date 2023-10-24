import { json, redirect } from "@vercel/remix";
import { Form, useActionData } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs} from "@vercel/remix";

import { db } from "~/utils/db.server";
import { authenticate } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { user } = await authenticate(request, { withOtpEnabled: true });

  if (user.otp_enabled === false) {
    return redirect("/settings/security");
  }

  return new Response(undefined);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { user } = await authenticate(request, { withOtpEnabled: true });

  if (user.otp_enabled === false) {
    return redirect("/settings/security");
  }

  try {
    await db.user.update({
      where: { id: user.id },
      data: {
        otp_hex: null,
        otp_auth_url: null,
        otp_enabled: false,
        otp_verified: false,
      },
    });

    return redirect("/settings/security");
  } catch {
    return json(
      { message: "Failed to disable 2FA, try again" },
      { status: 500 }
    );
  }
};

const Enable2FA = () => {
  const actionData = useActionData<typeof action>();
  return (
    <section>
      <h1 className="text-xl font-medium mb-1">
        Disable 2 Factor Authentication
      </h1>
      <p className="mt-4 max-w-lg tracking-wide">
        You'll no longer be asked to provide a 6-digit code when logging in.
        This might put you at risk by reducing the layers of security on your
        account.
      </p>
      <p className="mt-4 max-w-lg tracking-wide">
        Are you sure you want to <strong>disable</strong> 2FA?
      </p>
      <Form method="POST" className="mt-4">
        <input type="hidden" name="nothing" value="nothing" />
        <button className="block mt-3 px-5 py-2 bg-rose-900 hover:bg-rose-600 active:bg-rose-700 rounded-lg text-white font-medium transition-colors">
          Disable
        </button>
        <p className="mt-2 text-rose-500 text-sm font-medium">&nbsp;{actionData?.message}</p>
      </Form>
    </section>
  );
};
export default Enable2FA;
