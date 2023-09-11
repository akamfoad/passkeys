import { redirect, type LoaderArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";

export const loader = async ({ request }: LoaderArgs) => {
  const { searchParams } = new URL(request.url);
  const verificationCode = searchParams.get("code");

  if (verificationCode === null) {
    return redirect("/login");
  }

  try {
    const { firstName } = await db.user.update({
      where: { verificationCode },
      data: { isVerified: true },
      select: { firstName: true },
    });

    const sp = new URLSearchParams();
    sp.set("congratulations", firstName);

    return redirect(`/login?${sp.toString()}`);
  } catch (error) {
    console.log(error);
    return redirect("/login");
  }
};
