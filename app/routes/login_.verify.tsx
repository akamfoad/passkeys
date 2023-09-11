import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useFetcher,
  useFormAction,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import classNames from "classnames";
import { useRef } from "react";
import { Carousel } from "~/components/Carousel";
import { Logout } from "~/icons/Logout";
import { authenticate } from "~/utils/auth.server";
import { getOTP } from "~/utils/otp.server";
import { twoFactorAuthCookie } from "~/utils/token.server";

export const loader = async ({ request }: LoaderArgs) => {
  const { user } = await authenticate(request, {
    check2FA: false,
    withOtpSecret: true,
    withOtpVerified: true,
    withOtpAuthUrl: true,
  });

  if (
    user.otp_hex === null ||
    user.otp_auth_url === null ||
    user.otp_verified === false ||
    user.otp_enabled === false
  ) {
    return redirect("/");
  }

  return json({ name: user.firstName });
};

export const action = async ({ request }: ActionArgs) => {
  const { user } = await authenticate(request, {
    check2FA: false,
    withOtpSecret: true,
    withOtpVerified: true,
  });

  if (
    user.otp_hex === null ||
    user.otp_auth_url === null ||
    user.otp_verified === false ||
    user.otp_enabled === false
  ) {
    return redirect("/");
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

  const headers = new Headers();
  headers.append("Set-Cookie", await twoFactorAuthCookie.serialize(true));

  throw redirect("/", { headers });
};

let prevTimeoutId: NodeJS.Timeout;
const TwoFactorAuthentication = () => {
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const { name } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const verifyFormRef = useRef<HTMLFormElement>(null);
  const verify2FAAction = useFormAction(".");

  const isSubmitting =
    navigation.state !== "idle" && navigation.formAction === verify2FAAction;


    const logout = ()=>{
        fetcher.submit(null, {action:"/actions/logout"})
    }

  return (
    <div className="min-h-screen grid grid-cols-2 gap-2">
      <Carousel message="2FA is an additional security layer when you login with your password. Use passkeys for a simpler and more secure login." />
      <div className="flex flex-col items-center px-4 sm:px-0 col-span-2 md:col-span-1">
        <Form
          ref={verifyFormRef}
          method="POST"
          preventScrollReset
          className="flex flex-col gap-5 w-full max-w-lg p-4 rounded-md sm:my-auto"
        >
          <div>
            <h1 className="font-bold text-2xl">
              Welcome Back <span className="text-emerald-800">{name}</span>
            </h1>
            <p className="text-slate-500 mt-4">
              Enter 6-digit code from your Authenticator app.
            </p>
          </div>
          <div>
            <div className="flex flex-col gap-1">
              <label htmlFor="token">6-digit code</label>
              <input
                id="token"
                name="token"
                className="rounded-md border border-zinc-300 block p-2 w-full"
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
            </div>
            <p
              className={classNames(
                "sm:ps-0.5 mt-1 text-rose-500 text-sm font-medium transition-opacity",
                { "opacity-0": isSubmitting }
              )}
            >
              &nbsp;{actionData?.message}
            </p>
          </div>
          <button className="mt-6 px-5 py-2 bg-emerald-950 rounded-lg text-white font-medium">
            Verify
          </button>
          {/* <button className=" text-slate-300 hover:text-slate-50 transition-colors"> */}
          <button type="button" className="flex items-center gap-2 justify-center px-5 py-1.5 border-2 border-emerald-950 rounded-lg font-medium" onClick={logout}>
            Logout
            <Logout />
          </button>
            </Form>
      </div>
    </div>
  );
};

export default TwoFactorAuthentication;
