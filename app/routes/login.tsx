import classNames from "classnames";
import { useEffect, useMemo, useRef, useState } from "react";
import { json, type ActionArgs, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useFormAction,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";

import { db } from "~/utils/db.server";
import { LoginSchema } from "~/shared/schema/auth";
import { isPasswordMatch } from "~/utils/password.server";
import { tokenCookie } from "~/utils/token.server";
import {
  browserSupportsWebAuthnAutofill,
  startAuthentication,
} from "@simplewebauthn/browser";
import { Icon } from "~/icons/App";
import { Carousel } from "~/components/Carousel";

export const action = async ({ request }: ActionArgs) => {
  const requestData = await request.formData();
  const parseResult = LoginSchema.safeParse(Object.fromEntries(requestData));

  if (!parseResult.success) {
    return json(parseResult.error.flatten().fieldErrors, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: {
      email: parseResult.data.email,
      isVerified: true,
    },
    select: {
      password: true,
      id: true,
    },
  });

  if (
    user === null ||
    !isPasswordMatch(parseResult.data.password, user.password)
  ) {
    return json({ message: "Bad credentials!" }, { status: 401 });
  }

  const headers = new Headers();
  headers.append("Set-Cookie", await tokenCookie.serialize(user.id));

  throw redirect("/", { headers });
};

const Login = () => {
  const navigation = useNavigation();
  const congratulateeRef = useRef<HTMLDivElement | null>(null);
  const errors = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [authenticatingWithPasskey, setAuthenticatingWithPasskey] =
    useState(false);
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

  useEffect(() => {
    browserSupportsWebAuthnAutofill().then((supported) => {
      if (supported) {
        (async () => {
          fetch("/actions/passkeys/authentication")
            .then((res) => res.json())
            .then(({ options }) => {
              startAuthentication(options, true).then((asseResp) =>
                fetch("/actions/passkeys/authentication", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    asseResp,
                    challenge: options.challenge,
                  }),
                  redirect: "follow",
                })
              );
            })
            .catch(console.error);
        })();
      }
    });
  }, []);

  const isLoggingIn =
    navigation.state !== "idle" && navigation.formAction === loginFormAction;

  const loginWithPasskeys = async () => {
    setAuthenticatingWithPasskey(true);

    const resp = await fetch("/actions/passkeys/authentication");
    const { options } = await resp.json();

    let asseResp;
    try {
      asseResp = await startAuthentication(options);
    } catch (error) {
      setAuthenticatingWithPasskey(false);
      throw error;
    }

    const verificationResp = await fetch("/actions/passkeys/authentication", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ asseResp, challenge: options.challenge }),
    });

    // Wait for the results of verification
    const verificationJSON = await verificationResp.json();

    // Show UI appropriate for the `verified` status
    if (verificationJSON && verificationJSON.verified) {
      setTimeout(() => {
        window.location.pathname = "/";
      }, 250);
    }

    setAuthenticatingWithPasskey(false);
  };

  return (
    <div className="min-h-screen grid grid-cols-2 gap-2">
      <Carousel message="Sign in with Passkeys if you already have one, or sign in with your password and create one." />
      <div className="flex flex-col items-center px-4 sm:px-0 col-span-2 md:col-span-1">
        <Form
          method="POST"
          className={classNames(
            "flex flex-col gap-5 w-full max-w-lg p-4 rounded-md sm:my-auto",
            {
              "mt-6": congratulatee === null && !errors?.message,
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
            {typeof errors?.message === "string" && (
              <div
                className={classNames("px-4 py-2 bg-rose-500/20 rounded-lg")}
              >
                {errors.message}
              </div>
            )}
          </div>
          <div className="mt-6">
            <div className="flex flex-col gap-1">
              <label className="w-20" htmlFor="email">
                Email:
              </label>
              <div className="relative flex-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="pasha@soran.mir"
                  className="rounded-md border border-zinc-300 block p-2 w-full"
                  autoComplete="email username webauthn"
                />
                <button
                  onClick={loginWithPasskeys}
                  type="button"
                  disabled={authenticatingWithPasskey}
                  className={classNames(
                    "flex items-center justify-center absolute w-8 h-8 right-3 inset-y-0 my-auto",
                    "aspect-square p-2 rounded-lg text-slate-600 hover:bg-slate-500/10",
                    {
                      "bg-slate-500/10": authenticatingWithPasskey,
                      hidden: isLoggingIn && !authenticatingWithPasskey,
                    }
                  )}
                >
                  {authenticatingWithPasskey ? (
                    <svg
                      aria-hidden="true"
                      className="inline w-4 h-4 animate-spin text-transparent fill-emerald-900"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                  ) : (
                    <Icon height={16} />
                  )}
                </button>
              </div>
            </div>
            <p className="sm:ps-0.5 mt-1 text-rose-500 text-sm font-medium">
              &nbsp;{errors?.email?.[0]}
            </p>
          </div>
          <div>
            <div className="flex flex-col gap-1">
              <label className="w-20" htmlFor="password">
                Password:
              </label>
              <input
                type="password"
                name="password"
                id="password"
                className="rounded-md border border-zinc-300 block p-2 flex-1"
                autoComplete="current-password webauthn"
              />
            </div>
            <p className="sm:ps-0.5 mt-1 text-rose-500 text-sm font-medium">
              &nbsp;{errors?.password?.[0]}
            </p>
          </div>
          <button className="mt-6 px-5 py-2 bg-emerald-950 rounded-lg text-white font-medium">
            Login
          </button>
          <p className="text-center mt-4">
            Don't have an account?
            <Link className="ms-2 p-2 rounded-lg" to="/signup">
              Sign up
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
};

export default Login;
