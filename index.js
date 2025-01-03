const fastify = require("fastify")({
  bodyLimit: 1024 * 1024 * 1024,
});
const axios = require("axios");
const { MEDAL_URL, ORACLE_URL, KONSTANT_URL, PORT } = process.env;

fastify.post("/decompile", async (req, reply) => {
  let { key } = req.headers;
  if (!key) ({ key } = req.query);

  const body = req.body;
  const headers = { "Content-Type": "application/json" };
  let url = ORACLE_URL;
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
      payload = Buffer.from(body.script, "base64").toString("utf-8");
    } catch {
      return reply.status(400).send({ error: "Invalid base64 encoded script" });
    }
  }

  try {
    const response = await axios.post(url, payload, { headers });
    reply.send(response.data);
  } catch (error) {
    reply
      .status(error?.response?.status ?? 500)
      .send(error?.response?.data ?? { error: "Internal Server Error" });
  }
});

fastify.listen({ port: PORT || 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
