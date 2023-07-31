import { Link, useSearchParams } from "@remix-run/react";

const Verify = () => {
  const [searchParams] = useSearchParams();

  const name = searchParams.get("name");
  const email = searchParams.get("email");
  return (
    <div>
      <h1>Congratulations {name}!</h1>
      <p>
        You successfully signed up, we sent you a verification email at {email}
      </p>
      <p>
        Already verified? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Verify;
