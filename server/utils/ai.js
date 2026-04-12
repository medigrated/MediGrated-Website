const axios = require("axios");

const HCM_URL = "http://127.0.0.1:8002";
const TIMEOUT_MS = 15000; // 15s – LLM calls can be slow

// Per-user session state (survives across messages within a session)
const userSessions = {};

/**
 * Classify the axios error into a user-friendly message.
 */
function describeError(err) {
  if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET") {
    return (
      "⚠️ The Medical AI service is not reachable (port 8002 is not running). " +
      "Please ask an admin to start the `hcm_api.py` service:\n" +
      "```\ncd chatbot_system && uvicorn hcm_api:app --port 8002\n```"
    );
  }
  if (err.code === "ETIMEDOUT" || err.code === "ECONNABORTED") {
    return (
      "⏳ The Medical AI service took too long to respond. " +
      "The LLM may be under load — please try again in a few seconds."
    );
  }
  if (err.response) {
    const status = err.response.status;
    const detail = err.response.data?.detail || err.response.statusText;
    return `⚠️ Medical AI returned an error (HTTP ${status}): ${detail}`;
  }
  console.error("❌ AI ERROR:", err.message);
  return "⚠️ The Medical AI service encountered an unexpected error. Please try again.";
}

async function getAIReply(message, userId) {
  // Ensure session exists
  if (!userSessions[userId]) {
    userSessions[userId] = { accumulatedText: "", messageCount: 0 };
  }

  const session = userSessions[userId];
  const input   = message.toLowerCase().trim();

  // ── ANALYZE command ────────────────────────────────────────────────────────
  if (input === "analyze") {
    if (!session.accumulatedText.trim()) {
      return "Please describe your symptoms before requesting an analysis.";
    }
    try {
      const response = await axios.post(
        `${HCM_URL}/predict`,
        { text: session.accumulatedText.trim(), analyze: true },
        { timeout: TIMEOUT_MS }
      );

      const { summary, prediction } = response.data;

      // Reset session after analysis
      userSessions[userId] = { accumulatedText: "", messageCount: 0 };

      if (summary) return summary;
      return `Primary Condition: ${prediction}\n\nPlease consult a qualified physician for a confirmed diagnosis.`;

    } catch (err) {
      return describeError(err);
    }
  }

  // ── Symptom collection ─────────────────────────────────────────────────────
  session.accumulatedText += " " + message;
  session.messageCount    += 1;

  try {
    const response = await axios.post(
      `${HCM_URL}/predict`,
      { text: message, analyze: false },
      { timeout: TIMEOUT_MS }
    );

    const { clinical_markers } = response.data;
    let reply = "";

    if (clinical_markers && clinical_markers.length > 0) {
      // Pick a random empathetic prefix for variety
      const prefixes = [
        "I'm so sorry you're experiencing that.",
        "That sounds really uncomfortable.",
        "I understand. Dealing with that can be tough.",
        "Thanks for sharing that with me."
      ];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      
      reply += `${prefix} I've made a note of your symptoms (${clinical_markers.join(", ")}).\n\n`;
    } else {
      reply += "I'm listening carefully. That sounds frustrating to deal with.\n\n";
    }

    reply += "Is there anything else you'd like to add? Take your time. Whenever you're ready, just type analyze and I'll give you my clinical assessment.";
    return reply;

  } catch (err) {
    return describeError(err);
  }
}

/**
 * Clear a user's session (e.g. when they start a new chat conversation).
 */
function clearSession(userId) {
  delete userSessions[userId];
}

module.exports = { getAIReply, clearSession };