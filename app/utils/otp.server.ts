import { randomBytes } from "node:crypto";
import { TOTP, Secret } from "otpauth";

export const getRandomHexSecret = () => randomBytes(20).toString("hex");

export const getOTP = (email: string, secret: string) => {
  return new TOTP({
    issuer: "passkeys.akamfoad.dev",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromHex(secret),
  });
};
