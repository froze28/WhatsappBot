require("dotenv").config();

const express = require("express");
const axios = require("axios");
const templates = require("./templates.json");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v20.0";

function normalizeMessage(text) {
  return String(text || "")
    .trim()
    .toLowerCase();
}

function findTemplate(message) {
  const normalizedMessage = normalizeMessage(message);

  if (!normalizedMessage) {
    return null;
  }

  return templates.find((template) =>
    template.keywords.some((keyword) => normalizedMessage.includes(normalizeMessage(keyword)))
  );
}

async function sendWhatsAppMessage(to, body) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error("Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        preview_url: false,
        body
      }
    },
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "WhatsApp Cloud API Bot"
  });
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== "text") {
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text?.body;
    const matchedTemplate = findTemplate(text);

    if (matchedTemplate) {
      await sendWhatsAppMessage(from, matchedTemplate.response);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook processing failed:", error.response?.data || error.message);
    return res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`WhatsApp bot listening on port ${PORT}`);
});

