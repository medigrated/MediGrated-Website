// server/models/FamilyMember.js
const mongoose = require('mongoose');

const FamilyMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // owner (patient)
  name: { type: String, required: true },
  relation: { type: String, required: true },
  age: { type: Number },
  notes: { type: String },
  latestStatus: { type: String }, // e.g., "BP: 120/80"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FamilyMember', FamilyMemberSchema);
