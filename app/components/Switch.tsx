import * as RadSwitch from "@radix-ui/react-switch";
import type { SwitchProps } from "@radix-ui/react-switch";

export const Switch = ({
  checked,
  onCheckedChange,
}: Pick<SwitchProps, "checked" | "onCheckedChange">) => {
  return (
    <RadSwitch.Root
      className="group inline-flex touch-none items-center"
      style={{ WebkitTapHighlightColor: "transparent" }}
      checked={checked}
      onCheckedChange={onCheckedChange}
    >
      <span className="group-data-[state=checked]:bg-green-500 focus-visible:ring-2 mr-4 h-6 w-10 cursor-pointer rounded-full border-2 border-transparent bg-zinc-600 ring-offset-2 ring-offset-zinc-900 transition duration-200">
        <RadSwitch.Thumb className="group-data-[state=checked]:ml-4 block h-5 w-5 origin-right rounded-full bg-white shadow transition-all duration-200" />
      </span>
    </RadSwitch.Root>
  );
};
