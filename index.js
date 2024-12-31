const fastify = require("fastify")({
  bodyLimit: 1024 * 1024 * 1024,
  logger: true,
});
const axios = require("axios");
const { MEDAL_URL, ORACLE_URL, KONSTANT_URL } = process.env;

fastify.post("/decompile", async (request, reply) => {
  let { key } = request.headers;
  if (!key) ({ key } = request.query);
  const body = request.body;
  const headers = { "Content-Type": "application/json" };
  let url = ORACLE_URL; // Default URL
  let payload;
  if (key?.startsWith("Bearer ")) {
    headers.Authorization = key;
    payload = body;
  } else if (key?.startsWith("MEDAL-")) {
    url = MEDAL_URL;
    headers["Content-Type"] = "text/plain";
    headers.Authorization = key.toUpperCase();
    payload = body.script;
  } else if (KONSTANT_URL) {
    url = KONSTANT_URL;
    headers["Content-Type"] = "text/plain";
    try {
      payload = atob(body.script); // Decoding the script
    } catch {
      return reply.status(400).send({ error: "Invalid base64 encoded script" });
    }
  }

  try {
    const response = await axios.post(url, payload, { headers });
    reply.send(response.data);
  } catch (error) {
    reply
      .code(error?.response?.status ?? 500)
      .send(error.response?.data ?? { error: "Internal Server Error" });
  }
});

fastify.listen({ port: process.env.PORT }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`app is listening ${fastify.server.address().port}`);
});
