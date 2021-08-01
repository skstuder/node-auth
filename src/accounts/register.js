import bcryptjs from "bcryptjs";
const { genSalt, hash } = bcryptjs;

export async function registerUser(email, password) {
  //dynamic import!
  const { user } = await import("../user/user.js");
  //generate the salt
  const salt = await genSalt(10);
  //hash with salt
  const hashedPassword = await hash(password, salt);
  //store oin database
  const result = await user.insertOne({
    email: {
      address: email,
      verified: false,
    },
    password: hashedPassword,
  });
  //return user from database
  return result.insertedId;
}
