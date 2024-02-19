import { type LoaderFunctionArgs } from "@vercel/remix";
import { Link, Outlet, useFetcher, useLoaderData, useRouteLoaderData } from "@remix-run/react";

import { Icon } from "~/icons/App";
import { Logout } from "~/icons/Logout";
import { UserCircle } from "~/icons/UserCircle";

import { authenticate } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { user } = await authenticate(request);
  return { user };
};

const Navbar = () => {
  const fetcher = useFetcher();
  const { user } = useLoaderData<typeof loader>();

  return (
    <header className="fixed inset-x-0 flex items-center justify-between h-14 px-4 lg:px-20 py-2 bg-slate-950 text-slate-50">
      <div>
        <Link to="/">
          <Icon />
        </Link>
      </div>
      <nav className="flex items-center gap-6">
        {user !== undefined ? (
          <>
            {/* FIXME make this a floating menu and put settings and logout buttons there */}
            <Link
              className="flex items-center gap-2 text-slate-300 hover:text-slate-50 transition-colors"
              to="/settings"
            >
              <span>{`${user.firstName} ${user.lastName}`}</span>
              <UserCircle />
            </Link>
            <fetcher.Form method="POST" action="/actions/logout">
              <button className="flex items-center gap-2 text-slate-300 hover:text-slate-50 transition-colors">
                Logout
                <Logout />
              </button>
            </fetcher.Form>
          </>
        ) : (
          <>
            <Link className="text-slate-300/80 text-sm" to="privacy-policy">
              Privacy Policy
            </Link>
            <Link to="register">Register</Link>
            <Link
              to="login"
              className="py-0.5 px-4 bg-slate-50 text-black rounded-md"
            >
              login
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

const App = () => {
  return (
    <>
      <Navbar />
      <div className="mt-14 px-4 lg:px-20 p-5 flex-1 bg-neutral-200">
        <Outlet />
      </div>
    </>
  );
};

export default App;
