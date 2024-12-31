const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const { MEDAL_URL, ORACLE_URL, KONSTANT_URL, PORT } = process.env;

const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json({ limit: "1gb" })); // Equivalent to `bodyLimit` in Fastify

app.post("/decompile", async (req, res) => {
  let { key } = req.headers;
  if (!key) ({ key } = req.query); // Extract `key` from query if not in headers
  const body = req.body;
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
      payload = Buffer.from(body.script, "base64").toString("utf-8"); // Decoding the script
    } catch {
      return res.status(400).send({ error: "Invalid base64 encoded script" });
    }
  }

  try {
    const response = await axios.post(url, payload, { headers });
    res.send(response.data);
  } catch (error) {
    res
      .status(error?.response?.status ?? 500)
      .send(error.response?.data ?? { error: "Internal Server Error" });
  }
});

app.listen(PORT || 3000, () => {
  console.log(`App is listening on port ${PORT || 3000}`);
});
