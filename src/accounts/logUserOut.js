import jwt from "jsonwebtoken";

const JWTSignature = process.env.JWT_SIGNATURE;

export async function logUserOut(request, reply) {
  try {
    const { session } = await import("../session/session.js");

    if (request?.cookies?.refreshToken) {
      const { refreshToken } = request.cookies;
      // decode refresh token
      const { sessionToken } = jwt.verify(refreshToken, JWTSignature);
      // Look up session
      await session.deleteOne({ sessionToken });
    }
    reply.clearCookie("refreshToken").clearCookie("accessToken");
    // Remove cookies
  } catch (error) {
    console.error(error);
  }
}
