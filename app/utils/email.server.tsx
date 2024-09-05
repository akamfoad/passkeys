import { Resend } from "resend";
import {
  AccountCreatedEmail,
  PasswordChangedEmail,
  ResetPasswordEmail,
} from "~/components/Email";

const EMAIL_FROM = process.env.EMAIL_FROM;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_VERIFY_URL = process.env.EMAIL_VERIFY_URL;
const EMAIL_RESET_PASSWORD_URL = process.env.EMAIL_RESET_PASSWORD_URL;
const EMAIL_SETTINGS_SECURITY_URL = process.env.EMAIL_SETTINGS_SECURITY_URL;

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

if (typeof EMAIL_VERIFY_URL !== "string") {
  throw new Error(
    `Expected EMAIL_VERIFY_URL to be a string, instead go ${EMAIL_VERIFY_URL}`
  );
}

if (typeof EMAIL_RESET_PASSWORD_URL !== "string") {
  throw new Error(
    `Expected EMAIL_RESET_PASSWORD_URL to be a string, instead go ${EMAIL_RESET_PASSWORD_URL}`
  );
}

if (typeof EMAIL_SETTINGS_SECURITY_URL !== "string") {
  throw new Error(
    `Expected EMAIL_SETTINGS_SECURITY_URL to be a string, instead go ${EMAIL_SETTINGS_SECURITY_URL}`
  );
}

const resend = new Resend(RESEND_API_KEY);

const getVerificationUrl = (code: string) => {
  const url = new URL(EMAIL_VERIFY_URL);
  url.searchParams.set("code", code);
  return url.href;
};

const getResetPasswordUrl = (code: string) => {
  const url = new URL(EMAIL_RESET_PASSWORD_URL);
  url.searchParams.set("code", code);
  return url.href;
};

const getSettingsSecurityUrl = () => {
  return new URL(EMAIL_SETTINGS_SECURITY_URL).toString();
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
    react: <AccountCreatedEmail name={name} email={to} url={getVerificationUrl(code)} />,
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
