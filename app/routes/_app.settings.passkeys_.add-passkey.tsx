import { useState } from "react";
import classNames from "classnames";
import { Link } from "@remix-run/react";
import { startRegistration } from "@simplewebauthn/browser";

import { Icon } from "~/icons/App";
import { generatePasskeyName } from "~/utils/ua";

const AddPasskey = () => {
  const [status, setStatus] = useState<{
    type: "COOL" | "DANG" | null;
    message: string;
  }>({ type: null, message: "" });
  const [isSuccess, setIsSuccess] = useState<true | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);

  const generatePasskey = async () => {
    // @simplewebauthn/server -> generateRegistrationOptions()
    setIsCreating(true);
    const resp = await fetch("/actions/passkeys/registration");
    let attResp;
    try {
      const { options } = await resp.json();
      attResp = await startRegistration(options);
    } catch (error) {
      if ((error as Error).name === "InvalidStateError") {
        setStatus({
          type: "DANG",
          message:
            "Error: Authenticator was probably already registered by user",
        });
      } else {
        setStatus({ type: "DANG", message: (error as Error).message });
      }

      setIsCreating(false);
      throw error;
    }

    // POST the response to the endpoint that calls
    // @simplewebauthn/server -> verifyRegistrationResponse()
    const verificationResp = await fetch("/actions/passkeys/registration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        attResp,
        name: generatePasskeyName(navigator.userAgent),
      }),
    });

    // Wait for the results of verification
    const verificationJSON = await verificationResp.json();

    if (verificationJSON && verificationJSON.verified) {
      setStatus({
        type: "COOL",
        message: "Successfully generated passkey",
      });
      setIsSuccess(true);
    }

    setIsCreating(false);
  };

  return (
    <section className="max-w-sm mx-auto sm:mx-0">
      <h1 className="text-center mb-6 text-lg font-light">
        Configure passwordless authentication
      </h1>
      <div className="flex justify-center items-center">
        <Icon />
      </div>
      <h3 className="text-center text-lg font-medium mb-5">Add a passkey</h3>
      <p className="text-sm">
        Your device supports passkeys, a password replacement that validates
        your identity using touch, facial recognition, a password, or a PIN.
      </p>
      <p className="mt-4 text-sm">
        Passkeys can be used for sign-in as a simple and secure alternative to
        your password and two-factor credentials.
      </p>
      <p
        className={classNames(
          "text-sm p-2 font-medium basis-0 rounded-md my-4",
          {
            "bg-rose-400/20 text-rose-800 ": status.type === "DANG",
            "bg-emerald-300/20 text-emerald-800 ": status.type === "COOL",
          }
        )}
      >
        &nbsp;{status.message}
      </p>
      <div className="flex items-center justify-center gap-6 mt-10">
        <Link className="px-6 py-2" to="/settings/passkeys">
          Cancel
        </Link>
        {isSuccess === true ? (
          <Link className="px-6 py-2" to="/settings/passkeys">
            See your passkeys
          </Link>
        ) : (
          <button
            className={classNames(
              "px-5 py-2 bg-emerald-700 rounded-lg self-center text-white font-medium",
              { "opacity-70": isCreating }
            )}
            onClick={generatePasskey}
          >
            {isCreating ? "Adding passkey..." : "Add passkey"}
          </button>
        )}
      </div>
    </section>
  );
};

export default AddPasskey;
