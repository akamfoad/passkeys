import { Link } from "@remix-run/react";
import { startRegistration } from "@simplewebauthn/browser";
import { useState } from "react";
import { Icon } from "~/icons/App";

const AddPasskey = () => {
  const [statusText, setStatusText] = useState("");
  const [isSuccess, setIsSuccess] = useState<true | undefined>(undefined);

  const generatePasskey = async () => {
    // @simplewebauthn/server -> generateRegistrationOptions()
    const resp = await fetch("/actions/passkeys/registration");
    let attResp;
    try {
      const {options} = await resp.json()
      attResp = await startRegistration(options);
    } catch (error) {
      if (error.name === "InvalidStateError") {
        setStatusText(
          "Error: Authenticator was probably already registered by user"
        );
      } else {
        setStatusText((error as Error).message);
      }

      throw error;
    }

    // POST the response to the endpoint that calls
    // @simplewebauthn/server -> verifyRegistrationResponse()
    const verificationResp = await fetch("/actions/passkeys/registration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attResp),
    });

    // Wait for the results of verification
    const verificationJSON = await verificationResp.json();

    if (verificationJSON && verificationJSON.verified) {
      setStatusText("Successfully generated passkey");
      setIsSuccess(true);
    }
  };

  return (
    <section className="max-w-sm">
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
      <p>&nbsp; {statusText}</p>
      <div className="flex items-center justify-center gap-6">
        <Link className="px-6 py-2" to="..">
          Cancel
        </Link>
        {isSuccess === true ? (
          <Link className="px-6 py-2" to="..">
            See your passkeys
          </Link>
        ) : (
          <button
            className="px-5 py-2 bg-emerald-700 rounded-lg self-center text-white font-medium"
            onClick={generatePasskey}
          >
            Add passkey
          </button>
        )}
      </div>
    </section>
  );
};

export default AddPasskey;
