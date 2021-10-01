import https from "https";
import { fastify } from "fastify";
import fetch from "cross-fetch";
import fastifyStaticPkg from "fastify-static";
const { fastifyStatic } = fastifyStaticPkg;
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

    app.get("/verify/:email/:token", {}, async (request, reply) => {
      try {
        const { email, token } = request.params;

        const values = { email, token };

        const httpsAgent = new https.Agent({
          rejectUnauthorized: false,
        });

        const res = await fetch("https://api.nodeauth.dev/api/verify", {
          method: "POST",
          body: JSON.stringify(values),
          credentials: "include",
          agent: httpsAgent,
          headers: { "Content-type": "application/json; charset=UTF-8" },
        });
        console.log("res", res);
        reply.code(200).send("all is good!");
        // send request to api
      } catch (error) {
        console.log(error);
        reply.send({
          data: {
            status: "FAILED",
          },
        });
      }
    });

    const PORT = 5000;
    await app.listen(PORT);
    console.log(`🚀 Server Listening at port: ${PORT}`);
  } catch (error) {
    console.log(error);
  }
}

startApp();
