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
    setPasskeyAuthMessage(null);
    setAuthenticatingWithPasskey(true);

    const resp = await fetch("/actions/passkeys/authentication");
    const { options } = await resp.json();

    let asseResp;
    try {
      asseResp = await startAuthentication(options, fromAutofill);
    } catch (error) {
      setAuthenticatingWithPasskey(false);
      if ((error as Error).name !== "NotAllowedError") {
        setPasskeyAuthMessage(
          "Failed to load necessary information to proceed login by passkey."
        );
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
      setTimeout(() => {
        window.location.pathname = "/";
      }, 250);
    } else {
      setPasskeyAuthMessage(
        verificationJSON?.message ||
          "Something went wrong while trying to authenticate user"
      );
    }

    setAuthenticatingWithPasskey(false);
  };

  useEffect(() => {
    browserSupportsWebAuthnAutofill().then((supported) => {
      if (supported) loginWithPasskeys(true);
    });
  }, []);

  return {
    authenticatingWithPasskey,
    passkeyAuthMessage,
    startLoginWithPasskeys: () => loginWithPasskeys(),
  };
};
