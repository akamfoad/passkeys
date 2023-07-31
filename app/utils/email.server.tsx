import { Resend } from "resend";
import { Email } from "~/components/Email";

const EMAIL_FROM = process.env.EMAIL_FROM;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_VERIFY_URL = process.env.EMAIL_VERIFY_URL;

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

const resend = new Resend(RESEND_API_KEY);

const getVerificationUrl = (code: string) => {
  const url = new URL(EMAIL_VERIFY_URL);
  url.searchParams.set("code", code);
  return url.href;
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
    react: <Email name={name} url={getVerificationUrl(code)} />,
  });

  return id;
};
