const axios = require("axios");

// Temporary session storage (simple version)
const userSessions = {};

async function getAIReply(message, userId) {
  try {
    if (!userSessions[userId]) {
      userSessions[userId] = {
        symptoms: [],
        awaitingConfirmation: false
      };
    }

    const session = userSessions[userId];
    const input = message.toLowerCase().trim();

    // ✅ If waiting for confirmation
    if (session.awaitingConfirmation) {
      if (input === "yes" || input === "y") {
        session.awaitingConfirmation = false;

        const response = await axios.post("http://127.0.0.1:8001/predict", {
          symptoms: session.symptoms
        });

        const predictions = response.data.predictions;
        const topDisease = response.data.top_disease;
        const description = response.data.description;
        const precautions = response.data.precautions;

        // Clean disease name
        const cleanName = (name) =>
          name.replace(/_/g, " ").replace(/\(.*?\)/, "").trim();

        // Sort predictions
        const sorted = predictions.sort((a, b) => b[1] - a[1]);

        // Top result
        const [topName, topScore] = sorted[0];

        let reply = "🩺 Most Likely Condition\n";
        reply += "--------------------------------\n";
        reply += `${cleanName(topName)} — ${(topScore * 100).toFixed(1)}%\n\n`;

        // Other conditions
        reply += "📊 Other Possibilities\n";
        reply += "--------------------------------\n";

        sorted.slice(1, 5).forEach(([disease, score]) => {
          reply += `• ${cleanName(disease)} — ${(score * 100).toFixed(1)}%\n`;
        });

        // Description
        if (description) {
          reply += "\n\n📖 About This Condition\n";
          reply += "--------------------------------\n";
          reply += `${description}\n`;
        }

        // Precautions
        if (precautions && precautions.length > 0) {
          reply += "\n\n🛡️ Recommended Precautions\n";
          reply += "--------------------------------\n";

          precautions.forEach((p, i) => {
            // capitalize first letter
            const clean = p.charAt(0).toUpperCase() + p.slice(1);
            reply += `${i + 1}. ${clean}\n`;
          });
        }

        // Disclaimer
        reply += "\n⚠️ This is not a medical diagnosis. Please consult a doctor.";

        // reset session
        session.symptoms = [];
        session.awaitingConfirmation = false;

        return reply;
      }

      if (input === "no" || input === "n") {
        session.awaitingConfirmation = false;
        return "Okay, you can continue adding symptoms.";
      }

      return "Please reply with 'yes' or 'no'.";
    }

    // ✅ Add symptom
    session.symptoms.push(message);

    const count = session.symptoms.length;

    // 🔹 Less than 3 symptoms
    if (count < 3) {
      return `Added symptom (${count}/3). Please enter more symptoms.`;
    }

    // 🔹 3 or more symptoms → ask confirmation
    session.awaitingConfirmation = true;

    return `You entered ${count} symptoms.\nDo you want to analyze? (yes/no)`;

  } catch (err) {
      console.error("❌ AI ERROR:", err.response?.data || err.message);

      if (err.response?.data?.error) {
        return err.response.data.error;
      }

      return "⚠️ AI error. Please try again.";
    }
}

module.exports = { getAIReply };