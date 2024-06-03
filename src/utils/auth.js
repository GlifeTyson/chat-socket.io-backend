import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import _ from "lodash";

export const createTokens = async ({ user, secret1 }) => {
  const createToken = jwt.sign(
    {
      user: _.pick(user, ["id", "username"]),
    },
    secret1,
    {
      expiresIn: "7d",
    }
  );

  return createToken;
};

export const hashPassword = (password) => {
  return bcrypt.hashSync(password, 12);
};
export const comparePassword = (password, hashPassword) => {
  return bcrypt.compareSync(password, hashPassword);
};
