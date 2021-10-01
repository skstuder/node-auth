import "./env.js";
import { fastify } from "fastify";
import fastifyStaticPkg from "fastify-static";
const { fastifyStatic } = fastifyStaticPkg;
import fastifyCookie from "fastify-cookie";
import fastifyCors from "fastify-cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDb } from "./db.js";
import { registerUser } from "./accounts/register.js";
import { authorizeUser } from "./accounts/authorize.js";
import { logUserIn } from "./accounts/logUserIn.js";
import { logUserOut } from "./accounts/logUserOut.js";
import { getUserFromCookies } from "./accounts/user.js";
import { sendEmail, mailInit } from "./mail/index.js";
import {
  createVerifyEmailLink,
  validateVerifyEmail,
} from "./accounts/verify.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// define server
const app = fastify();

async function startApp() {
  try {
    await mailInit();

    app.register(fastifyCors, {
      origin: [/\.nodeauth.dev/, "https://nodeauth.dev"],
      credentials: true,
    });

    app.register(fastifyCookie, {
      secret: process.env.COOKIE_SIGNATURE,
    });

    app.register(fastifyStatic, {
      root: path.join(__dirname, "public"),
    });

    //information that comes in is the REQUEST
    //think of it as the browser user requesting something
    app.post("/api/register", {}, async (request, reply) => {
      try {
        const userId = await registerUser(
          request.body.email,
          request.body.password
        );
        // if account creation was successful
        if (userId) {
          const emailLink = await createVerifyEmailLink(request.body.email);
          await sendEmail({
            to: request.body.email,
            subject: "Verify your email",
            html: `<a href="${emailLink}">verify</a>`,
          });
          await logUserIn(userId, request, reply);
          reply.send({
            data: {
              status: "SUCCESS",
              userId,
            },
          });
        }
      } catch (error) {
        console.error(error);
        reply.send({
          data: {
            status: "FAILED",
            userId,
          },
        });
      }
    });

    app.post("/api/authorize", {}, async (request, reply) => {
      try {
        const { isAuthorized, userId } = await authorizeUser(
          request.body.email,
          request.body.password
        );
        if (isAuthorized) {
          await logUserIn(userId, request, reply);
          reply.send({
            data: {
              status: "SUCCESS",
              userId,
            },
          });
        }
        reply.send({
          data: "Auth Failed",
        });
      } catch (error) {
        console.error(error);
        reply.send({
          data: {
            status: "FAILED",
            userId,
          },
        });
      }
    });

    app.post("/api/logout", {}, async (request, reply) => {
      try {
        await logUserOut(request, reply);
        reply.send({
          data: {
            status: "SUCCESS",
          },
        });
      } catch (error) {
        console.error(error);
        reply.send({
          data: {
            status: "FAILED",
            userId,
          },
        });
      }
    });

    app.post("/api/verify", {}, async (request, reply) => {
      try {
        const { token, email } = request.body;
        console.log("token, email", token, email);
        const isValid = await validateVerifyEmail(token, email);
        if (isValid) {
          return reply.code(200).send();
        }
        return reply.code(401).send();
      } catch (error) {
        console.error(error);
        reply.send({
          data: {
            status: "FAILED",
            userId,
          },
        });
      }
    });

    app.get("/test", {}, async (request, reply) => {
      // verify login
      try {
        const user = await getUserFromCookies(request, reply);
        if (user?._id) {
          reply.send({
            data: user,
          });
        } else {
          reply.send({
            data: "User Lookup Failed",
          });
        }
      } catch (e) {
        throw new Error(e);
      }
      // Return user email if it exists, otherwise return unauthorized
    });

    await app.listen(4000);
    console.log("🚀 Server Listening at port: 4000");
  } catch (error) {
    console.log(error);
  }
}

connectDb().then(() => {
  startApp();
});
