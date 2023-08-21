import { Icon } from "~/icons/App";
import { OutsideIcon } from "~/icons/OutsideIcon";

export default function Index() {
  return (
    <article className="mx-auto lg:prose-lg prose prose-emerald">
      <h2 className="flex items-center gap-2">
        <Icon /> Passkeys
      </h2>
      <p>
        Passkeys are a replacement for passwords. A password is something that
        can be remembered and typed, and a passkey is a secret stored on one’s
        devices, unlocked with biometrics. Learn more on{" "}
        <a
          target="_blank"
          rel="noreferrer"
          href="https://passkeys.dev"
          className="no-underline inline-flex items-center gap-1"
        >
          <strong>passkeys.dev</strong> <OutsideIcon />
        </a>
      </p>
      <p>Passkeys are:</p>
      <ul className="prose-li:marker:text-slate-500">
        <li>
          <strong>Intuitive</strong>: Creating and using passkeys is as simple
          as consenting to save and use them. No having to create a password.
        </li>
        <li>
          <strong>Automatically unique per-service</strong>: By design, passkeys
          are unique per-service. There’s no chance to reuse them.
        </li>
        <li>
          <strong>Breach-resistant</strong>: A passkey is only stored on a
          user’s devices. Relying Party (RP) servers store public keys. Even
          servers that assist in the syncing of passkeys across a user’s devices
          never have the ability to view or use the private keys for a user’s
          passkeys.
        </li>
        <li>
          <strong>Phishing-resistant</strong>: Rather than trust being rooted in
          a human who has to verify they’re signing into the right website or
          app, browser, and operating systems enforce that passkeys are only
          ever used for the appropriate service.
        </li>
      </ul>
    </article>
  );
}
