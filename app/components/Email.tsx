export const AccountCreatedEmail = ({
  name,
  email,
  url,
}: {
  name: string;
  email: string;
  url: string;
}) => {
  return (
    <html lang="en">
      <body>
        <p>Welcome to Passkeys {name}</p>
        <p>
          Someone used your email {email} to create an account on{" "}
          <a href="https://passkeys.akamfoad.dev">Passkeys</a>.
        </p>
        <p>If you didn't initiate this activity, please ignore this email.</p>
        <p>
          Otherwise, you can finish your Passkeys account registration by
          clicking the Verify button below:
        </p>
        <p>&nbsp;</p>
        <p>
          <a
            style={{
              padding: "6px 16px",
              backgroundColor: "#022c22",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
              fontWeight: "600",
            }}
            href={url}
          >
            Verify
          </a>
        </p>
      </body>
    </html>
  );
};

export const ResetPasswordEmail = ({
  email,
  url,
}: {
  email: string;
  url: string;
}) => {
  return (
    <html lang="en">
      <body>
        <p>
          Someone used your email {email} to reset password for an account on{" "}
          <a href="https://passkeys.akamfoad.dev">Passkeys</a>.
        </p>
        <p>If you didn't initiate this activity, please ignore this email.</p>
        <p>
          Otherwise, you can reset your password by clicking the Reset Password
          button below:
        </p>
        <p>&nbsp;</p>
        <p>
          <a
            style={{
              padding: "6px 16px",
              backgroundColor: "#022c22",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
              fontWeight: "600",
            }}
            href={url}
          >
            Reset Password
          </a>
        </p>
      </body>
    </html>
  );
};

export const PasswordChangedEmail = ({
  name,
  email,
  url,
}: {
  name: string;
  email: string;
  url: string;
}) => {
  return (
    <html lang="en">
      <body>
        <p>Hi {name}</p>
        <p>
          Someone just changed the password of your account {email} on{" "}
          <a href="https://passkeys.akamfoad.dev">Passkeys</a>.
        </p>
        <p>If that was you, its safe to ignore this email.</p>
        <p>
          Otherwise, you should immediately change your password by clicking
          Change password button below:
        </p>
        <p>&nbsp;</p>
        <p>
          <a
            style={{
              padding: "6px 16px",
              backgroundColor: "#022c22",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
              fontWeight: "600",
            }}
            href={url}
          >
            Change password
          </a>
        </p>
      </body>
    </html>
  );
};
