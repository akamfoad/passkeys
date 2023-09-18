import { QRCodeSVG } from "@akamfoad/qrcode";
import type { LoaderArgs, ActionArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useMemo, useRef } from "react";
import { Input } from "~/components/Input";
import { authenticate } from "~/utils/auth.server";
import { db } from "~/utils/db.server";
import { getOTP } from "~/utils/otp.server";

export const loader = async ({ request }: LoaderArgs) => {
  const { user } = await authenticate(request, {
    withOtpSecret: true,
    withOtpVerified: true,
    withOtpAuthUrl: true,
  });

  if (user.otp_hex === null || user.otp_auth_url === null) {
    return redirect("/settings/security/enable-2fa");
  }

  if (user.otp_verified === true) {
    return redirect("/settings/security");
  }

  return json({ otpAuthUrl: user.otp_auth_url });
};

export const action = async ({ request }: ActionArgs) => {
  const { user } = await authenticate(request, {
    withOtpSecret: true,
    withOtpVerified: true,
  });

  if (user.otp_hex === null) {
    return redirect("/settings/security/enable-2fa");
  }

  if (user.otp_verified === true) {
    return redirect("/settings/security");
  }

  const body = await request.formData();

  const token = body.get("token") as string | null;

  if (token === null) {
    throw json({ message: "'token' field is required" }, { status: 400 });
  }

  const TOTP = getOTP(user.email, user.otp_hex);

  const delta = TOTP.validate({ token });

  if (delta === null) {
    return json(
      { message: "Failed to validate token, try again." },
      { status: 400 }
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      otp_enabled: true,
      otp_verified: true,
    },
  });

  return redirect("/settings/security");
};

let prevTimeoutId: NodeJS.Timeout;
const Verify2FA = () => {
  const verifyFormRef = useRef<HTMLFormElement>(null);
  const actionData = useActionData<typeof action>();
  const { otpAuthUrl } = useLoaderData<typeof loader>();

  const qrCodeSvg = useMemo(() => {
    const qrSVG = new QRCodeSVG(otpAuthUrl, { level: "H", padding: 6 });
    return qrSVG.toString();
  }, [otpAuthUrl]);

  return (
    <section>
      <h1 className="text-xl font-medium mb-1">
        Verify 2 Factor Authentication
      </h1>
      <p className="text-zinc-600">
        1. Scan below QRCode with your Authenticator app
      </p>

      <div
        className="w-full max-w-sm aspect-square mt-4"
        dangerouslySetInnerHTML={{ __html: qrCodeSvg || "" }}
      />

      <p className="text-zinc-600 mt-5">
        Or{" "}
        <a
          href={otpAuthUrl}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 mx-1 bg-sky-200 rounded-lg self-center text-sky-950"
        >
          Click Here
        </a>{" "}
        to setup your Authenticator app
      </p>
      <p className="text-zinc-600 mt-20">
        2. Enter 6-digit code generated by your Authenticator
      </p>
      <Form
        ref={verifyFormRef}
        preventScrollReset
        method="POST"
        encType="multipart/form-data"
        className="mt-4 max-w-sm"
      >
        <div className="flex items-center gap-3">
          <Input
            name="token"
            className="max-w-sm w-full bg-slate-50/70 disabled:bg-slate-50/50 disabled:text-gray-600/50"
            type="text"
            maxLength={6}
            minLength={6}
            inputMode="numeric"
            pattern="\d+"
            autoComplete="off"
            onChange={(e) => {
              clearTimeout(prevTimeoutId);
              if (e.target.value.length === 6) {
                prevTimeoutId = setTimeout(() => {
                  verifyFormRef.current?.requestSubmit();
                }, 300);
              }
            }}
          />
          <button className="px-5 py-2 bg-emerald-950 rounded-lg self-center text-white font-medium">
            verify
          </button>
        </div>
        <p className="sm:ps-0.5 mt-1 text-rose-500 text-sm font-medium">
          &nbsp;{actionData?.message}
        </p>
      </Form>
    </section>
  );
};
export default Verify2FA;
