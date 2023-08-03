import { Link, Outlet, useRouteLoaderData } from "@remix-run/react";
import { Icon } from "~/icons/App";
import { UserCircle } from "~/icons/UserCircle";

const Navbar = () => {
  const { user } = useRouteLoaderData("root");
  return (
    <header className="fixed inset-x-0 flex items-center justify-between h-14 px-20 py-2 bg-slate-950 text-slate-50">
      <div>
        <Link to="/">
          <Icon />
        </Link>
      </div>
      <nav className="flex">
        <Link className="flex items-center gap-2 text-slate-300 hover:text-slate-50 transition-colors" to="/settings">
          {user?.name}
          <UserCircle />
        </Link>
      </nav>
    </header>
  );
};

const App = () => {
  return (
    <>
      <Navbar />
      <div className="mt-14 px-20 p-5 flex-1 bg-neutral-200">
        <Outlet />
      </div>
    </>
  );
};

export default App;
