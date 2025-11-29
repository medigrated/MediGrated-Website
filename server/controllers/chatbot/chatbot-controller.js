// server/controllers/chatbot/chatbot-controller.js

const Message = require('../../models/Message');
const { getAIReply } = require("../../utils/ai");   // <-- IMPORT GROQ AI HELPER

// POST /api/chatbot/message
const postMessage = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.id)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { message } = req.body;
    if (!message || !message.trim())
      return res.status(400).json({ success: false, message: 'Message is required' });

    // Save user message to DB
    const userMsg = await Message.create({
      userId: user.id,
      sender: 'user',
      text: message,
    });

    // Generate AI reply using Groq LLaMA 3.1
    const replyText = await getAIReply(message);

    // Save bot message to DB
    const botMsg = await Message.create({
      userId: user.id,
      sender: 'bot',
      text: replyText,
    });

    return res.json({
      success: true,
      reply: replyText,
      userMessage: userMsg,
      botMessage: botMsg
    });

  } catch (err) {
    console.error('chatbot postMessage error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/chatbot/history
const getHistory = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.id)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const messages = await Message.find({ userId: user.id })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ success: true, messages });

  } catch (err) {
    console.error('chatbot getHistory error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/chatbot/history
const clearHistory = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.id)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    await Message.deleteMany({ userId: user.id });

    return res.json({ success: true, message: 'History cleared' });

  } catch (err) {
    console.error('chatbot clearHistory error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  postMessage,
  getHistory,
  clearHistory
};
