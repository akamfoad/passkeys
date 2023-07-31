import { createHash } from "node:crypto";

export const getRandomHash = (updateString: string) => {
  return createHash("sha256")
    .update(Buffer.from(updateString))
    .digest()
    .toString("base64");
};
