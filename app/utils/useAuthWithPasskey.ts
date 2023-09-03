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

    let options;
    try {
      const resp = await fetch("/actions/passkeys/authentication");
      const { options: authOptions } = await resp.json();
      options = authOptions;
    } catch {
      setPasskeyAuthMessage(
        "Failed to load necessary information to proceed login by passkey."
      );
    }

    setPasskeyAuthMessage(null);

    let asseResp;
    try {
      asseResp = await startAuthentication(options, fromAutofill);
    } catch (error) {
      setAuthenticatingWithPasskey(false);
      if (error instanceof Error && error.name !== "NotAllowedError") {
        setPasskeyAuthMessage(error.message);
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
