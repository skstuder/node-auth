import { fastify } from "fastify";
import pkg from "fastify-static";
const { fastifyStatic } = pkg;
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify();

async function startApp() {
  try {
    app.register(fastifyStatic, {
      root: path.join(__dirname, "public"),
    });

    app.get("/", {}, (request, reply) => {
      reply.send({
        data: "hello world",
      });
    });

    await app.listen(4000);
    console.log("🚀 Server Listening at port: 3000");
  } catch (error) {
    console.log(error);
  }
}

startApp();
