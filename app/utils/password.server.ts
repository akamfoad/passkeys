import * as bcrypt from "bcrypt";

export const encryptPassword = (password: string) => {
  return bcrypt.hashSync(password, 10);
};

export const isPasswordMatch = (plain: string, hash: string) => {
  return bcrypt.compareSync(plain, hash);
};
