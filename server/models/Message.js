// server/models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: String, enum: ['user','bot'], required: true },
  text: { type: String, required: true },
  meta: { type: Object }, // optional: confidence, intent, attachments, etc.
}, {
  timestamps: true
});

// Optional index for performance
MessageSchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
