import { Link } from "@remix-run/react";

const PrivacyPolicy = () => {
  return (
    <article className="max-w-xl mx-auto mt-20 prose">
      <nav className="space-x-2 mb-8">
        <Link className="text-emerald-800 hover:text-emerald-600 transition px-2 py-1 rounded-md" to="/">Passkeys</Link>
        <span>/</span>
        <span>Privacy Policy</span>
      </nav>
      <h1>Passkeys</h1>
      <section>
        <h2>Introduction</h2>
        <p>
          Passkeys web application is a PWA demonstrating how passkeys work. It
          contains a typical service that users use on the web and on their
          devices natively, this service gives you the ability to create
          Passkeys to login to the system. Helps you understand how passkeys are
          used on the web and abroad and how it plays along current security
          measures, such as password, 2FA and more.
        </p>
      </section>
      <section>
        <h2>Information we collect</h2>
        <p>We collect the following types of information:</p>
        <ul>
          <li>
            Email address when you create your account, your email is only used
            to authenticate your account and it is not linked to any other
            information about you outside the service.
          </li>
          <li>
            Information provided by you at onboarding time and through using the
            web app:
            <ul>
              <li>Full Name</li>
              <li>Passkey public keys (credential IDs)</li>
            </ul>
          </li>
        </ul>
      </section>
      <section>
        <h2>How we collect information</h2>
        <p>
          We only collect and store information your provide, no analytics
          service is used to identify you in any shape or form, the service is
          free and it is purpose is for educational purpose.
        </p>
      </section>
      <section>
        <h2>What we use your personal information for</h2>
        <p>
          Informations you provide during onboarding and through using the app
          such as your email address, your password and your passkeys are used
          to provide the Passkeys functionality to you.
        </p>
      </section>
      <section>
        <h2>Cookies and tracking technologies</h2>
        <p>
          The website uses first-party cookie to keep you logged in, this
          information is not shared with any other party, and no other party
          have access to your information. The web app uses no tracking
          technologies.
        </p>
      </section>
    </article>
  );
};

export default PrivacyPolicy;
