import { useState } from "react";
import { WebAuthnError, startAuthentication } from "@simplewebauthn/browser";

export const useAuthWithPasskey = () => {
  const [authenticatingWithPasskey, setAuthenticatingWithPasskey] =
    useState(false);
  const [passkeyAuthMessage, setPasskeyAuthMessage] = useState<string | null>(
    null
  );

  const startLoginWithPasskeys = async () => {
    setAuthenticatingWithPasskey(true);
    setPasskeyAuthMessage(null);

    let options;
    try {
      const resp = await fetch("/actions/passkeys/authentication");
      const { options: authOptions } = await resp.json();
      options = authOptions;
    } catch {
      setPasskeyAuthMessage(
        "Failed to load necessary information to proceed login by passkey."
      );

      return;
    }

    let asseResp;
    try {
      asseResp = await startAuthentication(options);
    } catch (error) {
      setAuthenticatingWithPasskey(false);

      if (
        error instanceof WebAuthnError &&
        error.code === "ERROR_CEREMONY_ABORTED"
      ) {
        return;
      }

      console.log(error);
      if (error instanceof Error && error.name !== "NotAllowedError") {
        setPasskeyAuthMessage(error.message);
      }
    }

    if (asseResp === undefined) {
      setAuthenticatingWithPasskey(false);
      setPasskeyAuthMessage("Something went wrong, try again!");
      return;
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
      window.location.pathname = "/";
    } else {
      setPasskeyAuthMessage(
        verificationJSON?.message ||
          "Something went wrong while trying to authenticate user"
      );
    }

    setAuthenticatingWithPasskey(false);
  };

  return {
    passkeyAuthMessage,
    startLoginWithPasskeys,
    authenticatingWithPasskey,
  };
};
