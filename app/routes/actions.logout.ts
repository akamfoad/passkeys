import { redirect } from "@vercel/remix";
import { tokenCookie } from "~/utils/token.server";

const logoutUser = async () => {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    await tokenCookie.serialize(null, {
      expires: new Date(0),
      maxAge: undefined,
    })
  );
  return redirect("/login", { headers });
};

export const action = async () => {
  throw await logoutUser();
};

export const loader = async () => {
  throw await logoutUser();
};
