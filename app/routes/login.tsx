import {
  Form,
  Link,
  useActionData,
  useFormAction,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import classNames from "classnames";
import { json, redirect } from "@vercel/remix";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@vercel/remix";

import { Icon } from "~/icons/App";
import { Carousel } from "~/components/Carousel";
import { Spinner } from "~/components/Spinner";

import { db } from "~/utils/db.server";
import { isPasswordMatch } from "~/utils/password.server";
import { tokenCookie, twoFactorAuthCookie } from "~/utils/token.server";
import { useAuthWithPasskey } from "~/utils/useAuthWithPasskey";

import { LoginSchema } from "~/shared/schema/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get("Cookie");

  const id = await tokenCookie.parse(cookieHeader);

  if (!id) {
    return new Response(undefined);
  }

  const is2FAed = await twoFactorAuthCookie.parse(cookieHeader);
  if (!is2FAed) throw redirect("/login/verify");

  return redirect("/");
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const requestData = await request.formData();
  const parseResult = LoginSchema.safeParse(Object.fromEntries(requestData));

  if (!parseResult.success) {
    console.log(parseResult.error.flatten());
    return json(parseResult.error.flatten().fieldErrors, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: {
      email: parseResult.data.email,
      isVerified: true,
    },
    select: {
      id: true,
      password: true,
      otp_enabled: true,
    },
  });

  if (
    user === null ||
    !isPasswordMatch(parseResult.data.password, user.password)
  ) {
    return json({ message: "Bad credentials!" }, { status: 401 });
  }

  const isOtpEnabled = user.otp_enabled === true;

  const headers = new Headers();
  headers.append("Set-Cookie", await tokenCookie.serialize(user.id));
  headers.append(
    "Set-Cookie",
    await twoFactorAuthCookie.serialize(isOtpEnabled ? false : true)
  );

  if (isOtpEnabled) throw redirect("/login/verify", { headers });

  throw redirect("/", { headers });
};

const Login = () => {
  const navigation = useNavigation();
  const {
    authenticatingWithPasskey,
    passkeyAuthMessage,
    startLoginWithPasskeys,
  } = useAuthWithPasskey();
  const congratulateeRef = useRef<HTMLDivElement | null>(null);
  const errors = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  const loginFormAction = useFormAction(".", { relative: "path" });
  const [congratulatee, setCongratulatee] = useState(
    searchParams.get("congratulations")
  );

  const isCongratulationsPresent = useMemo(() => {
    return searchParams.has("congratulations");
  }, [searchParams]);

  useEffect(() => {
    if (isCongratulationsPresent) {
      const sp = new URLSearchParams(searchParams);
      sp.delete("congratulations");
      setSearchParams(sp, { replace: true });
    }
  }, [isCongratulationsPresent, searchParams, setSearchParams]);

  useEffect(() => {
    if (congratulatee !== null) {
      const timeoutHandle = setTimeout(() => {
        setCongratulatee(null);
      }, 10_000);

      return () => clearTimeout(timeoutHandle);
    }
  }, [congratulatee]);

  const isLoggingIn =
    navigation.state !== "idle" && navigation.formAction === loginFormAction;

  return (
    <div className="min-h-screen grid grid-cols-2 gap-2">
      <Carousel message="Sign in with Passkeys if you already have one, or sign in with your password and create one." />
      <div className="flex flex-col items-center px-4 sm:px-0 col-span-2 md:col-span-1">
        <Form
          method="POST"
          className={classNames(
            "flex flex-col gap-5 w-full max-w-lg p-4 rounded-md sm:my-auto",
            {
              "mt-6": congratulatee === null,
            }
          )}
        >
          <div>
            <h1 className="font-bold text-2xl">Welcome Back!</h1>
            <p className="text-slate-500 mt-4">
              Sign in to explore and learn about Passkeys!
            </p>
          </div>
          <div className="flex justify-start min-h-[40px]">
            {congratulatee !== null && (
              <div
                ref={congratulateeRef}
                className="px-4 py-2 bg-emerald-500/20 rounded-lg"
              >
                Congratulations <strong>{congratulatee}</strong>, your account
                is successfully verified!
              </div>
            )}
            {errors !== undefined && "message" in errors && (
              <div
                className={classNames("px-4 py-2 bg-rose-500/20 rounded-lg")}
              >
                {errors.message}
              </div>
            )}
            {passkeyAuthMessage !== null && (
              <div
                className={classNames("px-4 py-2 bg-rose-500/20 rounded-lg")}
              >
                {passkeyAuthMessage}
              </div>
            )}
          </div>
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
                autoComplete="email username webauthn"
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
            <div className="flex flex-col gap-1">
              <label className="w-20" htmlFor="password">
                Password:
              </label>
              <Input
                type="password"
                name="password"
                id="password"
                className="h-11"
                autoComplete="current-password webauthn"
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
          <Button className="mt-6 py-6" disabled={navigation.state !== "idle"}>
            Login
          </Button>
          <Button
            className="py-6 gap-3"
            disabled={authenticatingWithPasskey || navigation.state !== "idle"}
            onClick={startLoginWithPasskeys}
            type="button"
            variant="outline"
          >
            {authenticatingWithPasskey ? (
              <Spinner />
            ) : (
              <>
                <Icon height={24} />
                <span>Login with passkey</span>
              </>
            )}
          </Button>
          <p className="text-center mt-4">
            Don't have an account?
            <Link className="ms-2 p-2 rounded-lg" to="/register">
              Register
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
};

export default Login;
