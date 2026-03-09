/**
 * twilioService.js
 * 
 * Wrapper around the Twilio WhatsApp Business API.
 * All credentials are loaded from environment variables — just set them in .env
 * and everything works immediately.
 *
 * Required .env variables:
 *   TWILIO_ACCOUNT_SID   — your Twilio Account SID
 *   TWILIO_AUTH_TOKEN    — your Twilio Auth Token
 *   TWILIO_WHATSAPP_FROM — your approved Twilio WhatsApp sender, e.g. whatsapp:+14155238886
 */

const twilio = require('twilio');

// Lazily initialised client — only created once real credentials exist
let _client = null;

function getClient() {
    if (_client) return _client;

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token || sid.startsWith('YOUR_') || token.startsWith('YOUR_')) {
        // Credentials not yet set — return a no-op stub so the rest of the app
        // continues working without throwing.
        return null;
    }

    _client = twilio(sid, token);
    return _client;
}

/**
 * Send a WhatsApp message via Twilio.
 *
 * @param {string} toPhone   - Recipient phone in E.164 format, e.g. "+919876543210"
 * @param {string} body      - Message text
 * @returns {Promise<boolean>} true if sent, false if skipped (no credentials / no phone)
 */
async function sendWhatsApp(toPhone, body) {
    if (!toPhone) {
        console.log('[Twilio] Skipped — recipient has no phone number stored.');
        return false;
    }

    const client = getClient();
    if (!client) {
        console.warn('[Twilio] Credentials not configured yet. Message NOT sent:\n', body);
        return false;
    }

    const from = process.env.TWILIO_WHATSAPP_FROM;
    if (!from) {
        console.warn('[Twilio] TWILIO_WHATSAPP_FROM not set. Message NOT sent.');
        return false;
    }

    try {
        const msg = await client.messages.create({
            from: `whatsapp:${from.replace('whatsapp:', '')}`,
            to: `whatsapp:${toPhone.replace('whatsapp:', '')}`,
            body
        });
        console.log(`[Twilio] ✅ Message sent to ${toPhone}: SID ${msg.sid}`);
        return true;
    } catch (err) {
        console.error(`[Twilio] ❌ Failed to send to ${toPhone}:`, err.message);
        return false;
    }
}

/**
 * Send to multiple recipients concurrently.
 * Silently skips any recipient without a stored phone number.
 *
 * @param {Array<{phone:string, name:string}>} recipients
 * @param {string} body
 */
async function sendWhatsAppBulk(recipients, body) {
    const tasks = recipients
        .filter(r => r && r.phone)
        .map(r => sendWhatsApp(r.phone, body));
    await Promise.allSettled(tasks);
}

module.exports = { sendWhatsApp, sendWhatsAppBulk };
