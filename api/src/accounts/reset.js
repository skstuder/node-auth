import crypto from "crypto";
const { ROOT_DOMAIN, JWT_SIGNATURE } = process.env;

function createResetToken(email, expTimeStamp) {
  try {
    //Auth string, JWT Signature, email
    const authString = `${JWT_SIGNATURE}:${email}:${expTimeStamp}`;
    return crypto.createHash("sha256").update(authString).digest("hex");
  } catch (error) {
    console.log(error);
  }
}

function validateExpTimestamp(expTimeStamp) {
  //One day in milliseconds
  const expTime = 24 * 60 * 60 * 1000;
  //Difference between now and expired time
  const dateDiff = Number(expTimeStamp) - Date.now();
  //Expired if not in past or difference in time is less than allowed
  const isValid = dateDiff > 0 && dateDiff < expTime;
  return isValid;
}

export async function createResetEmailLink(email) {
  try {
    // Create Email Link
    // Link email contains user email, token that is validated server side, expiration date
    const URIencodedEmail = encodeURIComponent(email);
    // create timestamp
    const expTimeStamp = Date.now() + 24 * 60 * 60 * 1000;

    const token = createResetToken(email, expTimeStamp);
    return `https://${ROOT_DOMAIN}/reset/${URIencodedEmail}/${expTimeStamp}/${token}`;
    // If user exists send email
    // Create Token
    // const emailToken = await createVerifyEmailToken(email);
    // Encode url string
    // Return link for verification
  } catch (error) {
    console.log(error);
  }
}

export async function createResetLink(email) {
  try {
    const { user } = await import("../user/user.js");
    // Check to see if a user exists with that email
    const foundUser = await user.findOne(
      {
        "email.address": email,
      },
      {
        $set: { "email.verified": true },
      }
    );
    console.log(foundUser, "found User");

    if (foundUser) {
      const link = await createResetEmailLink(email);
      return link;
    }
    return "";
    // // Create a hash aka token
    // const emailToken = await createVerifyEmailToken(email);
    // const isValid = emailToken === token;
    // // compare hash with token
    // if (isValid) {
    //   // then if successful, update user to make them verified
    //   // return success
    //   return true;
    // }
    // return false;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function validateResetEmail(token, email, expTimeStamp) {
  try {
    // Create a hash aka token
    const resetToken = createResetToken(email, expTimeStamp);
    const isValid = resetToken === token;
    const isTimestampValid = validateExpTimestamp(expTimeStamp);
    return isValid && isTimestampValid;
    // create hash of new password for the db

    // Check to see if user exists and update them with new password
  } catch (error) {
    console.log(error);
    return false;
  }
}
