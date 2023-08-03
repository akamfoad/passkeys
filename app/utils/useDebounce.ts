import { useEffect, useState } from "react";

export const useDebounce = <T>({
  value,
  time,
  unless,
}: {
  value: T;
  time: number;
  unless: boolean;
}) => {
  const [state, setState] = useState(value);

  useEffect(() => {
    if (state !== value) {
      if (value === unless) setState(value);
      else {
        const timeoutHandle = setTimeout(() => {
          setState(value);
        }, time);

        return () => clearTimeout(timeoutHandle);
      }
    }
  }, [state, time, unless, value]);

  return state;
};
