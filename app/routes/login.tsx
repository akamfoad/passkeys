import classNames from "classnames";
import { useEffect, useRef } from "react";
import { json, type ActionArgs, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";

import { db } from "~/utils/db.server";
import { LoginSchema } from "~/shared/schema/auth";
import { isPasswordMatch } from "~/utils/password.server";
import { tokenCookie } from "~/utils/token.server";
import { startAuthentication } from "@simplewebauthn/browser";
import { Icon } from "~/icons/App";

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
  const navigate = useNavigate();
  const congratulateeRef = useRef<HTMLDivElement | null>(null);
  const errors = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();

  const congratulatee = searchParams.get("congratulations");

  useEffect(() => {
    if (congratulateeRef.current) {
      congratulateeRef.current.classList.replace("max-h-10", "max-h-0");
    }
  }, []);

  const loginWithPasskeys = async () => {
    const resp = await fetch("/actions/passkeys/authentication");
    const { options } = await resp.json();

    let asseResp;
    try {
      asseResp = await startAuthentication(options);
    } catch (error) {
      throw error;
    }

    const verificationResp = await fetch("/actions/passkeys/authentication", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ asseResp, challenge: options.challenge }),
      redirect: "follow",
    });

    // Wait for the results of verification
    const verificationJSON = await verificationResp.json();

    // Show UI appropriate for the `verified` status
    if (verificationJSON && verificationJSON.verified) {
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col items-center px-4 sm:px-0">
      {congratulatee !== null && (
        <div
          ref={congratulateeRef}
          className="mb-3 mt-6 px-4 py-2 bg-emerald-500/20 max-h-10 rounded-lg transition-all duration-100 transform delay-[3000ms] overflow-hidden"
          onTransitionEnd={() => {
            const sp = new URLSearchParams(searchParams);
            sp.delete("congratulations");
            setSearchParams(sp);
          }}
        >
          Congratulations <strong>{congratulatee}</strong>, your account is
          successfully verified!
        </div>
      )}
      {typeof errors?.message === "string" && (
        <div
          className={classNames("mb-3 px-4 py-2 bg-rose-500/20 rounded-lg", {
            "mt-3": congratulatee !== null,
            "mt-6": congratulatee === null,
          })}
        >
          {errors.message}
        </div>
      )}

      <Form
        method="POST"
        className={classNames(
          "flex flex-col gap-5 bg-slate-100 w-full max-w-lg p-4 rounded-md",
          {
            "mt-6": congratulatee === null && !errors?.message,
          }
        )}
      >
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-1">
            <label className="w-20" htmlFor="email">
              Email:
            </label>
            <div className="relative flex-1">
              <input
                type="email"
                name="email"
                id="email"
                placeholder="pasha@soran.mir"
                className="rounded-md bg-white block p-2 w-full"
                autoComplete="email username webauthn"
              />
              <button
                onClick={loginWithPasskeys}
                type="button"
                className="aspect-square p-2 rounded-lg text-slate-600 hover:bg-slate-500/10 flex items-center justify-center absolute right-3 inset-y-0 my-auto"
              >
                <Icon height={16} />
              </button>
            </div>
          </div>
          <p className="sm:ms-24 sm:ps-1 mt-1 text-rose-500 text-sm font-medium">
            &nbsp;{errors?.email?.[0]}
          </p>
        </div>
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-1">
            <label className="w-20" htmlFor="password">
              Password:
            </label>
            <input
              type="password"
              name="password"
              id="password"
              className="rounded-md bg-white block p-2 flex-1"
              autoComplete="current-password webauthn"
            />
          </div>
          <p className="sm:ms-24 sm:ps-1 mt-1 text-rose-500 text-sm font-medium">
            &nbsp;{errors?.password?.[0]}
          </p>
        </div>
        <button className="mt-6 px-5 py-2 bg-emerald-700 rounded-lg self-center text-white font-medium">
          Login
        </button>
        <Link className="self-center px-5 py-2 rounded-lg" to="/signup">
          Sign up
        </Link>
      </Form>
    </div>
  );
};

export default Login;
