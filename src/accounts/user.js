import mongo from "mongodb";
import jwt from "jsonwebtoken";

const { ObjectId } = mongo;
const JWTSignature = process.env.JWT_SIGNATURE;

export async function getUserFromCookies(request) {
  try {
    const { user } = await import("../user/user.js");
    if (request?.cookies?.accessToken) {
      // If access token
      const { accessToken } = request.cookies;
      // Decode access token
      const decodedAccessToken = jwt.verify(accessToken, JWTSignature);
      // Return user from record
      return user.findOne({
        _id: ObjectId(decodedAccessToken?.userId),
      });
    }
  } catch (e) {
    console.log(e);
  }
}

export async function refreshTokens() {
  try {
  } catch (e) {
    console.log(e);
  }
}
