import { getRandomHash } from "~/utils/crypto.server";

export const loader = () => {
  console.log(getRandomHash("me@akamfoad.dev"));

  return null;
};

const Login = () => {
  return <div>login</div>;
};

export default Login;
