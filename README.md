# WhatsApp Cloud API Bot

A small Node.js Express bot that receives WhatsApp Cloud API webhook messages, matches incoming text against predefined keywords, and replies with predefined templates from `templates.json`.

## Features

- Express webhook server
- WhatsApp webhook verification endpoint
- Keyword matching for `plans`, `lic`, and `health`
- Replies using WhatsApp Cloud API text messages
- Template responses stored in `templates.json`
- Environment-based configuration
- Render-ready deployment files

## Project Structure

```text
.
├── server.js
├── templates.json
├── package.json
├── render.yaml
├── .env.example
└── README.md
```

## Setup

Install dependencies:

```bash
npm install
```

Create a local `.env` file:

```bash
cp .env.example .env
```

Update `.env`:

```env
PORT=3000
WHATSAPP_VERIFY_TOKEN=your_custom_webhook_verify_token
WHATSAPP_TOKEN=your_whatsapp_cloud_api_access_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
GRAPH_API_VERSION=v20.0
```

Start the app:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Webhook URLs

Use these routes when configuring the webhook in Meta for Developers:

```text
GET  /webhook
POST /webhook
```

For local testing, expose your local server with a tunnel such as ngrok:

```bash
ngrok http 3000
```

Then use:

```text
https://your-ngrok-domain.ngrok-free.app/webhook
```

## Meta Webhook Verification

In Meta for Developers, configure:

- Callback URL: `https://your-domain.com/webhook`
- Verify token: the same value as `WHATSAPP_VERIFY_TOKEN`
- Webhook field subscription: `messages`

When Meta calls `GET /webhook`, the server checks:

- `hub.mode` equals `subscribe`
- `hub.verify_token` equals `WHATSAPP_VERIFY_TOKEN`

If valid, it returns `hub.challenge`.

## Templates

Edit `templates.json` to add or update keyword replies:

```json
[
  {
    "name": "plans",
    "keywords": ["plans"],
    "response": "Available Services:\n1. LIC Insurance\n2. Star Health Insurance\n3. SIP & Mutual Funds"
  }
]
```

The current templates are:

| Keyword | Response |
| --- | --- |
| `plans` | Available services list |
| `lic` | Age, occupation, and requirement prompt |
| `health` | Age, city, and family members prompt |

## Deploy to Render

1. Push this project to a GitHub repository.
2. Create a new **Web Service** on Render.
3. Connect your GitHub repository.
4. Use these settings:
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add these environment variables in Render:
   - `WHATSAPP_VERIFY_TOKEN`
   - `WHATSAPP_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `GRAPH_API_VERSION`
6. Deploy the service.
7. Set the Meta webhook callback URL to:

```text
https://your-render-service.onrender.com/webhook
```

## Notes

- The bot only replies to text messages.
- Unknown keywords are acknowledged with HTTP `200` but no WhatsApp reply is sent.
- WhatsApp requires a valid Cloud API access token and phone number ID.
