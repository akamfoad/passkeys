import { Resend } from "resend";
import {
  AccountCreatedEmail,
  PasswordChangedEmail,
  ResetPasswordEmail,
} from "~/components/Email";

const EMAIL_FROM = process.env.EMAIL_FROM;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const HOST_BASE_URL = process.env.HOST_BASE_URL;

if (typeof EMAIL_FROM !== "string") {
  throw new Error(
    `Expected EMAIL_FROM to be a string, instead go ${EMAIL_FROM}`
  );
}

if (typeof RESEND_API_KEY !== "string") {
  throw new Error(
    `Expected RESEND_API_KEY to be a string, instead go ${RESEND_API_KEY}`
  );
}

if (typeof HOST_BASE_URL !== "string") {
  throw new Error(
    `Expected HOST_BASE_URL to be a string, instead go ${HOST_BASE_URL}`
  );
}

const resend = new Resend(RESEND_API_KEY);

const getVerificationUrl = (code: string) => {
  const url = new URL("/verify-email", HOST_BASE_URL);
  url.searchParams.set("code", code);
  return url.href;
};

const getResetPasswordUrl = (code: string) => {
  const url = new URL("/reset-password", HOST_BASE_URL);
  url.searchParams.set("code", code);
  return url.href;
};

const getSettingsSecurityUrl = () => {
  return new URL("/settings/security", HOST_BASE_URL).toString();
};

export const sendVerificationEmail = async ({
  to,
  name,
  code,
}: {
  to: string;
  name: string;
  code: string;
}) => {
  const { id } = await resend.emails.send({
    to,
    from: EMAIL_FROM,
    subject: "Passkeys Verification Code",
    react: (
      <AccountCreatedEmail
        name={name}
        email={to}
        url={getVerificationUrl(code)}
      />
    ),
  });

  return id;
};

export const sendResetPasswordEmail = async ({
  to,
  code,
}: {
  to: string;
  code: string;
}) => {
  const { id } = await resend.emails.send({
    to,
    from: EMAIL_FROM,
    subject: "Reset Password | Passkeys",
    react: <ResetPasswordEmail email={to} url={getResetPasswordUrl(code)} />,
  });

  return id;
};

export const sendPasswordChangedEmail = async ({
  to,
  name,
}: {
  to: string;
  name: string;
}) => {
  const { id } = await resend.emails.send({
    to,
    from: EMAIL_FROM,
    subject: "Password Changed | Passkeys",
    react: (
      <PasswordChangedEmail
        name={name}
        email={to}
        url={getSettingsSecurityUrl()}
      />
    ),
  });

  return id;
};
