import classNames from "classnames";
import type { ClassAttributes, InputHTMLAttributes } from "react";

export const Input = (
  props: JSX.IntrinsicAttributes &
    ClassAttributes<HTMLInputElement> &
    InputHTMLAttributes<HTMLInputElement>
) => (
  <input
    {...props}
    className={classNames("rounded-md bg-white block p-2", props.className)}
  />
);
