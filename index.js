const fastify = require("fastify")({
  bodyLimit: 1024 * 1024 * 1024, // 1GB
});
const axios = require("axios");
const { ORACLE_URL, PORT } = process.env;

fastify.post("/decompile", async (request, reply) => {
  let { key } = request.headers;
  if (!key) ({ key } = request.query);
  const headers = { "Content-Type": "application/json", Authorization: key };

  try {
    const response = await axios.post(ORACLE_URL, request.body, { headers });
    reply.send(response.data);
  } catch (error) {
    reply
      .code(error?.response?.status ?? 500)
      .send(error.response?.data ?? { error: "Internal Server Error" });
  }
});

fastify.listen({ port: PORT || 3000, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
