import type { CredentialDeviceType } from "@simplewebauthn/typescript-types";
export const rpName = process.env.PASSKEY_RP_NAME as string;
export const rpID = process.env.PASSKEY_RP_ID as string;
export const rpOrigin = process.env.PASSKEY_RP_ORIGIN as string;

if (typeof rpName !== "string") {
  throw new Error(
    `Expected PASSKEY_RP_NAME to be a string, instead go ${rpName}`
  );
}

if (typeof rpID !== "string") {
  throw new Error(`Expected PASSKEY_RP_ID to be a string, instead go ${rpID}`);
}

if (typeof rpOrigin !== "string") {
  throw new Error(
    `Expected PASSKEY_RP_ORIGIN to be a string, instead go ${rpOrigin}`
  );
}

export type Authenticator = {
  // SQL: Encode to base64url then store as `TEXT`. Index this column
  credentialID: Uint8Array;
  // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
  credentialPublicKey: Uint8Array;
  // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
  counter: number;
  // SQL: `VARCHAR(32)` or similar, longest possible value is currently 12 characters
  // Ex: 'singleDevice' | 'multiDevice'
  credentialDeviceType: CredentialDeviceType;
  // SQL: `BOOL` or whatever similar type is supported
  credentialBackedUp: boolean;
  // SQL: `VARCHAR(255)` and store string array as a CSV string
  // Ex: ['usb' | 'ble' | 'nfc' | 'internal']
  transports?: AuthenticatorTransport[];
};
