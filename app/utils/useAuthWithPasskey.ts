import { useEffect, useState } from "react";
import {
  browserSupportsWebAuthnAutofill,
  startAuthentication,
} from "@simplewebauthn/browser";

export const useAuthWithPasskey = () => {
  const [authenticatingWithPasskey, setAuthenticatingWithPasskey] =
    useState(false);
  const [passkeyAuthMessage, setPasskeyAuthMessage] = useState<string | null>(
    null
  );

  const loginWithPasskeys = async (fromAutofill?: boolean) => {
    if (!fromAutofill) {
      setAuthenticatingWithPasskey(true);
    }

    setPasskeyAuthMessage(null);

    let options;
    try {
      const resp = await fetch("/actions/passkeys/authentication");
      const { options: authOptions } = await resp.json();
      options = authOptions;
    } catch {
      if (!fromAutofill) {
        setPasskeyAuthMessage(
          "Failed to load necessary information to proceed login by passkey."
        );
      }

      return;
    }

    let asseResp;
    try {
      asseResp = await startAuthentication(options, fromAutofill);
    } catch (error) {
      console.log(error);
      if (!fromAutofill) {
        setAuthenticatingWithPasskey(false);
        if (error instanceof Error && error.name !== "NotAllowedError") {
          setPasskeyAuthMessage(error.message);
        }
      }
    }

    if (asseResp === undefined) return;

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
    } else if (!fromAutofill) {
      setPasskeyAuthMessage(
        verificationJSON?.message ||
          "Something went wrong while trying to authenticate user"
      );
    }

    if (!fromAutofill) {
      setAuthenticatingWithPasskey(false);
    }
  };

  useEffect(() => {
    try {
      browserSupportsWebAuthnAutofill().then((supported) => {
        if (supported) loginWithPasskeys(true);
      });
    } finally {
      return;
    }
  }, []);

  return {
    authenticatingWithPasskey,
    passkeyAuthMessage,
    startLoginWithPasskeys: () => loginWithPasskeys(),
  };
};
