const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    name: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    remainingAmount: { type: Number, required: true },
    timesPerDay: { type: Number, required: true },
    schedule: [{ type: String }], // e.g., ["08:00", "20:00"]
    notes: { type: String, default: '' }, // e.g., "Take with food"
    lastTakenAt: { type: Date },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Medicine', MedicineSchema);
