const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, required: true },
    action: { type: String, required: true }, // e.g., "consumed medicine Paracetamol"
    status: { type: String, enum: ['consumed', 'missed', 'skipped'], default: 'consumed' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
