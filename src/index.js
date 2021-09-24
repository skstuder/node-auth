import "./env.js";
import { fastify } from "fastify";
import fastifyStaticPkg from "fastify-static";
const { fastifyStatic } = fastifyStaticPkg;
import path from "path";
import { fileURLToPath } from "url";
import { connectDb } from "./db.js";
import { registerUser } from "./accounts/register.js";
import { authorizeUser } from "./accounts/authorize.js";
import fastifyCookie from "fastify-cookie";
import { logUserIn } from "./accounts/logUserIn.js";
import { getUserFromCookies } from "./accounts/user.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify();

async function startApp() {
  try {
    app.register(fastifyCookie, {
      secret: process.env.COOKIE_SIGNATURE,
    });

    app.register(fastifyStatic, {
      root: path.join(__dirname, "public"),
    });

    //information that comes in is the REQUEST
    app.post("/api/register", {}, async (request, reply) => {
      try {
        const userId = await registerUser(
          request.body.email,
          request.body.password
        );
      } catch (error) {
        console.error(error);
      }
    });

    app.post("/api/authorize", {}, async (request, reply) => {
      try {
        console.log(request.body.email, request.body.password);
        const { isAuthorized, userId } = await authorizeUser(
          request.body.email,
          request.body.password
        );
        if (isAuthorized) {
          await logUserIn(userId, request, reply);
          reply.send({
            data: "User Logged In",
          });
        }
        reply.send({
          data: "Auth Failed",
        });
      } catch (error) {
        console.error(error);
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
