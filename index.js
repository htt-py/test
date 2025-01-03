const fastify = require("fastify")({
  bodyLimit: 1024 * 1024 * 1024,
});
const axios = require("axios");
const { MEDAL_URL, ORACLE_URL, KONSTANT_URL, PORT } = process.env;
const cache = require("@fastify/caching");
const crypto = require("crypto");
fastify.register(cache, {
  privacy: "public",
  expiresIn: 3600,
});

fastify.post("/decompile", async (request, reply) => {
  let { key } = request.headers;
  if (!key) ({ key } = request.query);

  const body = request.body;
  const headers = { "Content-Type": "application/json" };
  let url = ORACLE_URL;
  let payload;

  const bytecode = body.script || "";
  const options = JSON.stringify(body.decompilerOptions || {});
  const cacheKey = crypto
    .createHash("sha256")
    .update(bytecode + options)
    .digest("hex");

  const cachedResponse = await fastify.cache.get(cacheKey);
  if (cachedResponse) {
    return reply.send(cachedResponse);
  }

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
    fastify.cache.set(cacheKey, response.data);
    reply.send(response.data);
  } catch (error) {
    reply
      .code(error?.response?.status || 500)
      .send({ error: error?.response?.data || "Internal Server Error" });
  }
});

fastify.listen({ port: PORT || 3000, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
