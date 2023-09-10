import { z } from "zod";
import {
  Form,
  Link,
  useActionData,
  useFormAction,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";

import { Input } from "~/components/Input";

import { db } from "~/utils/db.server";
import { useDebounce } from "~/utils/useDebounce";
import { authenticate } from "~/utils/auth.server";
import { encryptPassword, isPasswordMatch } from "~/utils/password.server";

const passwordSchema = z
  .object({
    currentPassword: z
      .string({
        required_error: "Current Password is required",
        invalid_type_error: "Current Password must be a string",
      })
      .min(10, "Current Password must be at least 10 characters")
      .max(255, "Current Password must be at most 255 characters"),
    newPassword: z
      .string({
        required_error: "New Password is required",
        invalid_type_error: "New Password must be a string",
      })
      .min(10, "New Password must be at least 10 characters")
      .max(255, "New Password must be at most 255 characters"),
    confirmNewPassword: z
      .string({
        required_error: "Confirm Password is required",
        invalid_type_error: "Confirm Password must be a string",
      })
      .min(10, "Confirm Password must be at least 10 characters")
      .max(255, "Confirm Password must be at most 255 characters"),
  })
  .required()
  .refine(
    ({ newPassword, confirmNewPassword }) => newPassword === confirmNewPassword,
    {
      message: "Confirm Password should match New Password",
      path: ["confirmNewPassword"],
    }
  );

export const loader = async ({ request }: LoaderArgs) => {
  const {
    user: { email, otp_enabled },
  } = await authenticate(request, { withOtpEnabled: true });

  return { email, otp_enabled };
};

export const action = async ({ request }: ActionArgs) => {
  const { user } = await authenticate(request, { withPassword: true });

  const formData = await request.formData();

  const extendedPasswordSchema = passwordSchema
    .refine(
      ({ currentPassword }) => isPasswordMatch(currentPassword, user.password),
      { message: "Bad credentials", path: ["currentPassword"] }
    )
    .refine(({ newPassword }) => !isPasswordMatch(newPassword, user.password), {
      message: "New Password shouldn't be same as Current Password",
      path: ["newPassword"],
    });

  const parseResult = extendedPasswordSchema.safeParse(
    Object.fromEntries(formData)
  );

  if (!parseResult.success) {
    return json(parseResult.error.flatten().fieldErrors, { status: 400 });
  }

  try {
    await db.user.update({
      where: { id: user.id },
      data: { password: encryptPassword(parseResult.data.newPassword) },
    });
  } catch (error) {
    throw json({ message: "Something went wrong" });
  }

  return json(null, { status: 200 });
};

const SecuritySettings = () => {
  const navigation = useNavigation();
  const errors = useActionData<typeof action>();
  const { email, otp_enabled } = useLoaderData<typeof loader>();
  const formAction = useFormAction(".");
  const isSaving = useDebounce({
    value: navigation.state !== "idle" && navigation.formAction === formAction,
    time: 500,
    unless: true,
  });

  return (
    <section>
      <section className="max-w-sm">
        <h1 className="text-xl font-medium mb-1">Two-factor authentication</h1>
        <p>
          {otp_enabled
            ? "Two factor authentication has been enabled."
            : "Two factor authentication is not enabled."}
        </p>
        {otp_enabled ? (
          <button className="mt-3 px-5 py-2 bg-rose-900 hover:bg-rose-600 active:bg-rose-700 rounded-lg self-center text-white font-medium transition-colors">
            Disable
          </button>
        ) : (
          <Link to="enable-2fa">Enable</Link>
        )}
      </section>
      <section className="mt-14">
        <h1 className="text-xl font-medium mb-1">Change password</h1>
        <hr className="h-[2px] bg-zinc-300/50" />
        <Form method="POST" className="mt-6 space-y-4">
          <input type="hidden" name="email" value={email} hidden />
          <div className="space-y-1">
            <label className="text-sm min-w-[80px]">Current Password:</label>
            <Input
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              className="max-w-sm w-full bg-slate-50/70 disabled:bg-slate-50/50 disabled:text-gray-600/50"
            />
            <p className="mt-1 text-rose-500 text-sm font-medium">
              &nbsp;{errors?.currentPassword?.[0]}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-sm min-w-[80px]">New Password:</label>
            <Input
              type="password"
              name="newPassword"
              autoComplete="new-password"
              className="max-w-sm w-full bg-slate-50/70 disabled:bg-slate-50/50 disabled:text-gray-600/50"
            />
            <p className="mt-1 text-rose-500 text-sm font-medium">
              &nbsp;{errors?.newPassword?.[0]}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-sm min-w-[80px]">
              Confirm New Password:
            </label>
            <Input
              type="password"
              name="confirmNewPassword"
              autoComplete="new-password"
              className="max-w-sm w-full bg-slate-50/70 disabled:bg-slate-50/50 disabled:text-gray-600/50"
            />
            <p className="mt-1 text-rose-500 text-sm font-medium">
              &nbsp;{errors?.confirmNewPassword?.[0]}
            </p>
          </div>
          <button className="px-5 py-2 bg-emerald-950 rounded-lg self-center text-white font-medium">
            {isSaving ? "Saving..." : "Save"}
          </button>
        </Form>
      </section>
    </section>
  );
};

export default SecuritySettings;
