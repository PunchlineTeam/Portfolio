// Cloudflare Worker — proxy for the "join the team" form on the Punchline site.
//
// Why: the site is static (GitHub Pages), so anything in script.js is public.
// The bot token must NOT live in the client. This Worker holds the token as a
// secret and forwards submissions to Telegram server-side.
//
// Configure (see worker/README.md):
//   Secret:    TELEGRAM_BOT_TOKEN   (wrangler secret put TELEGRAM_BOT_TOKEN)
//   Variable:  TELEGRAM_CHAT_ID     (e.g. -5189423412)
//   Variable:  ALLOWED_ORIGIN       (e.g. https://punchlineteam.github.io)

const MAX = { name: 100, contact: 200, role: 100, message: 2000 };

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || "*";
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": allowed,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return json({ ok: false, error: "method not allowed" }, 405, cors);
    }
    if (allowed !== "*" && origin && origin !== allowed) {
      return json({ ok: false, error: "forbidden" }, 403, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "bad json" }, 400, cors);
    }

    // Honeypot: real users never fill the hidden "website" field.
    if (body.website) return json({ ok: true }, 200, cors);

    const clean = (v, n) => String(v ?? "").trim().slice(0, n);
    const name = clean(body.name, MAX.name);
    const contact = clean(body.contact, MAX.contact);
    const role = clean(body.role, MAX.role);
    const message = clean(body.message, MAX.message);

    if (!name || !contact || !role || !message) {
      return json({ ok: false, error: "missing fields" }, 400, cors);
    }

    const text =
      `📩 Новая заявка с сайта\n\n` +
      `👤 Имя: ${name}\n📱 Контакт: ${contact}\n🎯 Специализация: ${role}\n\n` +
      `📝 О себе:\n${message}`;

    const tg = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
      }
    );

    if (!tg.ok) {
      return json({ ok: false, error: "send failed" }, 502, cors);
    }
    return json({ ok: true }, 200, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
