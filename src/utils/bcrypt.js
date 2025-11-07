import bcrypt from "bcryptjs";

const encryptPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const decryptPassword = async (oldPassword, newPassword) => {
  return await bcrypt.compare(oldPassword, newPassword);
};

export { encryptPassword, decryptPassword };
