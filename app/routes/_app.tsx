import { Link, Outlet, useRouteLoaderData } from "@remix-run/react";

const Icon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 0 24 24">
      <circle fill="currentColor" cx="10.5" cy="6" r="4.5" />
      <path
        fill="currentColor"
        d="M22.5 10.5a3.5 3.5 0 1 0-5 3.15V19l1.5 1.5 2.5-2.5-1.5-1.5 1.5-1.5-1.24-1.24a3.5 3.5 0 0 0 2.24-3.26zm-3.5 0a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm-4.56 2.02A6 6 0 0 0 12 12H9a6 6 0 0 0-6 6v2h13v-5.51a5.16 5.16 0 0 1-1.56-1.97z"
      />
    </svg>
  );
};

const Navbar = () => {
  const { user } = useRouteLoaderData("root");
  return (
    <header className="flex items-center justify-between h-14 px-20 py-2 bg-slate-950 text-slate-50">
      <div>
        <Link to="/">
          <Icon />
        </Link>
      </div>
      <nav className="flex">
        <Link to="/settings">{user?.name}</Link>
      </nav>
    </header>
  );
};

const App = () => {
  return (
    <>
      <Navbar />
      <div className="px-20 p-5 min-h-screen">
        <Outlet />
      </div>
    </>
  );
};

export default App;
