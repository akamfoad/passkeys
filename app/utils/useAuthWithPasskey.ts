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

  useEffect(() => {
    browserSupportsWebAuthnAutofill().then((supported) => {
      if (supported) {
        (async () => {
          fetch("/actions/passkeys/authentication")
            .then((res) => res.json())
            .then(({ options }) => {
              startAuthentication(options, true).then((asseResp) =>
                fetch("/actions/passkeys/authentication", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    asseResp,
                    challenge: options.challenge,
                  }),
                  redirect: "follow",
                })
              );
            })
            .catch(console.error);
        })();
      }
    });
  }, []);

  const loginWithPasskeys = async () => {
    setPasskeyAuthMessage(null);
    setAuthenticatingWithPasskey(true);

    const resp = await fetch("/actions/passkeys/authentication");
    const { options } = await resp.json();

    let asseResp;
    try {
      asseResp = await startAuthentication(options);
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

  return { authenticatingWithPasskey, passkeyAuthMessage, loginWithPasskeys };
};
