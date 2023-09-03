export const base64EncodeURL = (byteArray: Uint8Array) => {
  return btoa(
    Array.from(byteArray)
      .map((val) => String.fromCharCode(val))
      .join("")
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

export const base64DecodeURL = (b64urlstring: string) => {
  return new Uint8Array(
    atob(b64urlstring.replace(/-/g, "+").replace(/_/g, "/"))
      .split("")
      .map((val) => {
        return val.charCodeAt(0);
      })
  );
};
