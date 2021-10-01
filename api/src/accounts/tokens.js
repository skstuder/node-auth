import jwt from "jsonwebtoken";

const JWTSignature = process.env.JWT_SIGNATURE;

export async function createTokens(sessionToken, userId) {
  try {
    // Create Refresh Token
    // Session Id
    const refreshToken = jwt.sign(
      {
        sessionToken,
      },
      JWTSignature
    );
    // Create Access Token
    const accessToken = jwt.sign(
      {
        sessionToken,
        userId,
      },
      JWTSignature
    );
    // Session Id, User Id
    // Return Refresh Token & Access Token
    return { accessToken, refreshToken };
  } catch (error) {
    console.log("error", error);
  }
}
