import "./env.js";
import { fastify } from "fastify";
import fastifyStaticPkg from "fastify-static";
const { fastifyStatic } = fastifyStaticPkg;
import path from "path";
import { fileURLToPath } from "url";
import { connectDb } from "./db.js";
import { registerUser } from "./accounts/register.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify();

async function startApp() {
  try {
    app.register(fastifyStatic, {
      root: path.join(__dirname, "public"),
    });

    //information that comes in is the REQUEST
    app.post("/api/register", {}, async (request, reply) => {
      try {
        await registerUser(request.body.email, request.body.password);
      } catch (error) {
        console.error(error);
      }
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
