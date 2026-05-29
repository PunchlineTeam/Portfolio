# Form proxy (Cloudflare Worker)

Keeps the Telegram bot token off the public site. The form in `script.js` POSTs
the four fields here; the Worker formats the message and forwards it to Telegram
using a token stored as a server-side secret.

## One-time setup

1. **Revoke the old token.** It was published in the static site, so it is
   compromised. In Telegram, open **@BotFather → /revoke**, pick the bot, and
   copy the new token. (Existing chats and the chat ID stay the same.)

2. **Install Wrangler** (Cloudflare CLI) and sign in:
   ```
   npm install -g wrangler
   wrangler login
   ```

3. **Deploy the Worker** (run from this `worker/` folder):
   ```
   wrangler deploy
   ```

4. **Set the new token as a secret:**
   ```
   wrangler secret put TELEGRAM_BOT_TOKEN
   ```
   Paste the new token when prompted.

5. **Copy the Worker URL** printed by `wrangler deploy`
   (e.g. `https://punchline-form-proxy.<your-subdomain>.workers.dev`) and paste it
   into `FORM_ENDPOINT` near the top of `../script.js`.

## Notes

- `TELEGRAM_CHAT_ID` and `ALLOWED_ORIGIN` live in `wrangler.toml`. Update
  `ALLOWED_ORIGIN` if the site moves to a custom domain (origin only, no path).
- A hidden `website` honeypot field blocks basic spam bots.
