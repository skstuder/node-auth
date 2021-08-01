import bcryptjs from "bcryptjs";
const { genSalt, hash } = bcryptjs;

export async function registerUser(email, password) {
  //generate the salt
  const salt = await genSalt(10);
  console.log("salt", salt);
  //hash with salt
  const hashedPassword = await hash(password, salt);
  console.log("hashed password", hashedPassword);
  //store oin database
  //return user from database
}
