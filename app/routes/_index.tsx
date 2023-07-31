import type { V2_MetaFunction } from "@remix-run/node";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Passkeys" },
    { name: "description", content: "Passkey demonstration" },
  ];
};

export default function Index() {
  return <div>Passkeys</div>;
}
