import "./env.js";
import { authenticator } from "@otplib/preset-default";
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
import {
  getUserFromCookies,
  changePassword,
  register2FA,
} from "./accounts/user.js";
import { sendEmail, mailInit } from "./mail/index.js";
import { createResetLink, validateResetEmail } from "./accounts/reset.js";
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

    app.get("/api/user", {}, async (request, reply) => {
      const user = await getUserFromCookies(request, reply);
      if (user) {
        reply.send({ data: { user } });
      }
      reply.send({ data: {} });
    });

    app.post("/api/2fa-register", {}, async (request, reply) => {
      const user = await getUserFromCookies(request, reply);
      const { token, secret } = request.body;
      const isValid = authenticator.verify({ token, secret });
      if (user._id && isValid) {
        await register2FA(user._id, secret);
        reply.send("success");
      }
      reply.code(401).send();
    });

    app.post("/api/verify-2fa", {}, async (request, reply) => {
      const { token, email, password } = request.body;
      const { isAuthorized, userId, authenticatorSecret } = await authorizeUser(
        email,
        password
      );
      const isValid = authenticator.verify({
        token,
        secret: authenticatorSecret,
      });
      if (userId && isValid && isAuthorized) {
        await logUserIn(userId, request, reply);
        reply.send("success");
      }
      reply.code(401).send();
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
        const { isAuthorized, userId, authenticatorSecret } =
          await authorizeUser(request.body.email, request.body.password);
        if (isAuthorized && !authenticatorSecret) {
          await logUserIn(userId, request, reply);
          reply.send({
            data: {
              status: "SUCCESS",
              userId,
            },
          });
        } else if (isAuthorized && authenticatorSecret) {
          reply.send({
            data: {
              status: "2FA",
            },
          });
        }
        reply.code(401).send();
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

    app.post("/api/change-password", {}, async (request, reply) => {
      try {
        const { oldPassword, newPassword } = request.body;
        const user = await getUserFromCookies(request, reply);
        if (user?.email?.address) {
          const { isAuthorized, userId } = await authorizeUser(
            user.email.address,
            oldPassword
          );
          if (isAuthorized) {
            await changePassword(userId, newPassword);
            return reply.code(200).send("All Good");
            //update pass in db
          }
        }
        return reply.code(401).send();
        // If user is who they say they are
      } catch (error) {
        console.log(error);
        return reply.code(401).send();
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

    app.post("/api/forgot-password", {}, async (request, reply) => {
      try {
        const { email } = request.body;
        const link = await createResetLink(email);
        if (link) {
          await sendEmail({
            to: email,
            subject: "Reset your password",
            html: `<a href="${link}">Reset</a>`,
          });
        }

        return reply.code(200).send();
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

    app.post("/api/reset", {}, async (request, reply) => {
      try {
        const { email, password, token, time } = request.body;
        const isValid = await validateResetEmail(token, email, time);
        // find user
        if (isValid) {
          const { user } = await import("./user/user.js");
          const foundUser = await user.findOne({
            "email.address": email,
          });
          console.log("foundUser", foundUser, password);
          await changePassword(foundUser._id, password);
          return reply.code(200).send("Password Updated");
        }
        return reply.code(401).send("Reset Failed");
      } catch (error) {
        console.error(error);
        return reply.code(401).send("Reset Failed");
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
