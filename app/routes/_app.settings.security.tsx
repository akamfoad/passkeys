import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useFormAction,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { z } from "zod";
import { Input } from "~/components/Input";
import { authenticate } from "~/utils/auth.server";
import { db } from "~/utils/db.server";
import { encryptPassword, isPasswordMatch } from "~/utils/password.server";
import { useDebounce } from "~/utils/useDebounce";

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
    user: { email },
  } = await authenticate(request);

  return { email };
};

export const action = async ({ request }: ActionArgs) => {
  const { user } = await authenticate(request, {withPassword: true});

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
  const { email } = useLoaderData<typeof loader>();
  const formAction = useFormAction(".");
  const isSaving = useDebounce({
    value: navigation.state !== "idle" && navigation.formAction === formAction,
    time: 500,
    unless: true,
  });

  return (
    <section>
      <Form method="POST" className="space-y-4">
        <input type="hidden" name="email" value={email} hidden />
        <div className="space-y-1">
          <label className="min-w-[80px]">Current Password:</label>
          <Input
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            className="w-full lg:w-1/3  bg-slate-50/70 disabled:bg-slate-50/50 disabled:text-gray-600/50"
          />
          <p className="mt-1 text-rose-500 text-sm font-medium">
            &nbsp;{errors?.currentPassword?.[0]}
          </p>
        </div>
        <div className="space-y-1">
          <label className="min-w-[80px]">New Password:</label>
          <Input
            type="password"
            name="newPassword"
            autoComplete="new-password"
            className="w-full lg:w-1/3  bg-slate-50/70 disabled:bg-slate-50/50 disabled:text-gray-600/50"
          />
          <p className="mt-1 text-rose-500 text-sm font-medium">
            &nbsp;{errors?.newPassword?.[0]}
          </p>
        </div>
        <div className="space-y-1">
          <label className="min-w-[80px]">Confirm New Password:</label>
          <Input
            type="password"
            name="confirmNewPassword"
            autoComplete="new-password"
            className="w-full lg:w-1/3  bg-slate-50/70 disabled:bg-slate-50/50 disabled:text-gray-600/50"
          />
          <p className="mt-1 text-rose-500 text-sm font-medium">
            &nbsp;{errors?.confirmNewPassword?.[0]}
          </p>
        </div>
        <button className="px-5 py-2 bg-emerald-700 rounded-lg self-center text-white font-medium">
          {isSaving ? "Saving..." : "Save"}
        </button>
      </Form>
    </section>
  );
};

export default SecuritySettings;
