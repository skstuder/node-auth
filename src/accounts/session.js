import { randomBytes } from "crypto";

export async function createSession(userId, connection) {
  try {
    // Generate a session token
    const sessionToken = randomBytes(43).toString("hex");
    // Retrieve connection information
    const { ip, userAgent } = connection;
    // database insert for session
    const { session } = await import("../session/session.js");
    await session.insertOne({
      sessionToken,
      userId,
      valid: true,
      userAgent,
      ip,
      updatedAt: new Date(),
      createdAt: new Date(),
    });
    return sessionToken;
    // Return session token
  } catch (error) {
    throw new Error("Session Creation Failed");
  }
}
