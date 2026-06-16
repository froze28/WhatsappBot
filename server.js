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
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v23.0";

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
    template.keywords.some((keyword) =>
      normalizedMessage.includes(normalizeMessage(keyword))
    )
  );
}

async function sendWhatsAppMessage(to, body) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error(
      "Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID"
    );
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  console.log("Sending WhatsApp reply...");
  console.log("To:", to);
  console.log("Message:", body);

  const response = await axios.post(
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

  console.log("WhatsApp API Response:");
  console.log(JSON.stringify(response.data, null, 2));
}

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "WhatsApp Cloud API Bot"
  });
});

app.get("/webhook", (req, res) => {
  console.log("=== WEBHOOK VERIFICATION REQUEST ===");
  console.log(req.query);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return res.status(200).send(challenge);
  }

  console.log("Webhook verification failed");
  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  console.log("=================================");
  console.log("WEBHOOK EVENT RECEIVED");
  console.log("=================================");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      console.log("No message object found");
      return res.sendStatus(200);
    }

    console.log("Message Type:", message.type);

    if (message.type !== "text") {
      console.log("Ignoring non-text message");
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text?.body;

    console.log("From:", from);
    console.log("Text:", text);

    const matchedTemplate = findTemplate(text);

    if (!matchedTemplate) {
      console.log("No matching template found");

      await sendWhatsAppMessage(
        from,
        "Please send one of the following keywords:\n\nplans\nlic\nhealth\nsip"
      );

      return res.sendStatus(200);
    }

    console.log("Matched template:");
    console.log(matchedTemplate);

    await sendWhatsAppMessage(
      from,
      matchedTemplate.response
    );

    console.log("Reply sent successfully");

    return res.sendStatus(200);
  } catch (error) {
    console.error("=================================");
    console.error("WEBHOOK ERROR");
    console.error("=================================");

    if (error.response) {
      console.error(
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error(error);
    }

    return res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log("=================================");
  console.log(`WhatsApp bot listening on port ${PORT}`);
  console.log(`Verify Token Set: ${!!VERIFY_TOKEN}`);
  console.log(`Access Token Set: ${!!ACCESS_TOKEN}`);
  console.log(`Phone Number ID Set: ${!!PHONE_NUMBER_ID}`);
  console.log(`Graph API Version: ${GRAPH_API_VERSION}`);
  console.log("=================================");
});
