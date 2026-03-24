const mongoose = require('mongoose');

/**
 * DoseAlert — tracks which WhatsApp alert tiers have already been sent
 * so the scheduler never double-fires for the same dose slot on the same day.
 *
 * type values:
 *   '1.5h_admin'   — late warning sent to group creator
 *   '2.5h_members' — escalation sent to all group members
 *   '3.5h_missed'  — missed log created + final alert sent to admin
 */
const DoseAlertSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    scheduleSlot: { type: String, required: true }, // e.g. "14:00"
    date: { type: String, required: true },   // YYYY-MM-DD in local date
    type: { type: String, enum: ['1.5h_admin', '2.5h_members', '3.5h_missed'], required: true },
    sentAt: { type: Date, default: Date.now }
});

// Compound unique index — one record per (medicine, slot, date, alert-type)
DoseAlertSchema.index(
    { medicineId: 1, scheduleSlot: 1, date: 1, type: 1 },
    { unique: true }
);

module.exports = mongoose.model('DoseAlert', DoseAlertSchema);
