const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getAIReply(message) {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",   // ✅ UPDATED working model
      messages: [
        {
          role: "system",
          content:
            "You are a friendly, safe medical assistant. Never diagnose diseases. Provide general advice only."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    return completion.choices[0].message.content;

  } catch (err) {
    console.error("Groq AI error:", err.response?.data || err.message);
    return "⚠️ AI error. Please try again.";
  }
}

module.exports = { getAIReply };
