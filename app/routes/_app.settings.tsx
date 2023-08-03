import type { ReactNode } from "react";
import { NavLink, Outlet } from "@remix-run/react";
import classNames from "classnames";
import { KeyIcon } from "~/icons/KeyIcon";
import { GearIcon } from "~/icons/GearIcon";
import { Shield } from "~/icons/ShieldIcon";
import type { NavLinkProps } from "@remix-run/react";

const NavLinkC = ({
  icon,
  text,
  ...rest
}: NavLinkProps & { icon: ReactNode; text: string }) => {
  return (
    <NavLink
      end
      className={({ isActive }) =>
        classNames(
          "flex items-center gap-1.5 px-3 py-2 rounded-md font-medium transition-all",
          {
            "bg-slate-50/60": isActive,
            "hover:bg-slate-50/40": !isActive,
          }
        )
      }
      {...rest}
    >
      {icon}
      <span>{text}</span>
    </NavLink>
  );
};

const Settings = () => {
  return (
    <div className="flex gap-2">
      <div className="flex flex-col gap-2 min-w-[250px]">
        <NavLinkC icon={<GearIcon />} to="" end text="General" />
        <NavLinkC icon={<Shield />} to="security" text="Security" />
        <NavLinkC icon={<KeyIcon />} to="passkeys" text="Passkeys" />
      </div>
      <section className="ps-20 flex-1 rounded-md">
        <Outlet />
      </section>
    </div>
  );
};

export default Settings;
