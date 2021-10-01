import crypto from "crypto";
const { ROOT_DOMAIN, JWT_SIGNATURE } = process.env;

export async function createVerifyEmailToken(email) {
  try {
    //Auth string, JWT Signature, email
    const authString = `${JWT_SIGNATURE}:${email}`;
    return crypto.createHash("sha256").update(authString).digest("hex");
  } catch (error) {
    console.log(error);
  }
}

export async function createVerifyEmailLink(email) {
  try {
    // Create Token
    const emailToken = await createVerifyEmailToken(email);
    // Encode url string
    const URIencodedEmail = encodeURIComponent(email);
    // Return link for verification
    return `https://${ROOT_DOMAIN}/verify/${URIencodedEmail}/${emailToken}`;
  } catch (error) {
    console.log(error);
  }
}

export async function validateVerifyEmail(token, email) {
  try {
    // Create a hash aka token
    const emailToken = await createVerifyEmailToken(email);
    const isValid = emailToken === token;
    // compare hash with token
    if (isValid) {
      // then if successful, update user to make them verified
      const { user } = await import("../user/user.js");
      await user.updateOne(
        {
          "email.address": email,
        },
        {
          $set: { "email.verified": true },
        }
      );
      // return success
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
}
