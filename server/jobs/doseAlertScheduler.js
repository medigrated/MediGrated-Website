/**
 * doseAlertScheduler.js
 *
 * Background job that runs every 5 minutes.
 * For every scheduled dose slot across all groups it checks:
 *
 *  +1.5h — if dose not taken/skipped → WhatsApp to GROUP ADMIN (late warning)
 *  +2.5h — if dose not taken/skipped → WhatsApp to ALL GROUP MEMBERS (escalation)
 *  +3.5h — if dose not taken/skipped → create missed ActivityLog (red in UI) + WhatsApp to ADMIN (final)
 *
 * De-duplication: a DoseAlert record is written per (medicine, slot, date, type)
 * with a unique index, so the same alert can NEVER fire twice.
 */

const Group = require('../models/Group');
const Medicine = require('../models/Medicine');
const ActivityLog = require('../models/ActivityLog');
const DoseAlert = require('../models/DoseAlert');
const User = require('../models/User');
const { sendWhatsApp, sendWhatsAppBulk } = require('../services/twilioService');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert "HH:MM" to today's Date object in local time */
function slotToDate(slotStr) {
    const [h, m] = slotStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
}

/** Today's date string "YYYY-MM-DD" based on local time */
function localDateStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Check if a dose was already consumed or skipped today.
 * Looks at ActivityLog for entries AFTER midnight today that match the medicine.
 */
async function isDoseTakenOrSkipped(groupId, medicineId, medicineName, todayStart) {
    const log = await ActivityLog.findOne({
        groupId,
        timestamp: { $gte: todayStart },
        status: { $in: ['consumed', 'skipped'] },
        action: { $regex: medicineName, $options: 'i' }
    });
    return !!log;
}

/**
 * Try to record a DoseAlert record. Returns false if the alert was already sent
 * (unique index violation), true if it's a new alert.
 */
async function recordAlert(medicineId, groupId, scheduleSlot, date, type) {
    try {
        await DoseAlert.create({ medicineId, groupId, scheduleSlot, date, type });
        return true; // newly inserted — alert should fire
    } catch (err) {
        if (err.code === 11000) return false; // duplicate — already sent
        throw err;
    }
}

// ─── Core Checker ─────────────────────────────────────────────────────────────

async function runDoseAlertCheck() {
    const now = new Date();
    const todayStr = localDateStr();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    console.log(`[DoseAlert] Running check at ${now.toLocaleTimeString()}`);

    // Load all groups with their medicines
    const groups = await Group.find({}).populate('members creator');

    for (const group of groups) {
        const medicines = await Medicine.find({ groupId: group._id });

        for (const med of medicines) {
            if (!med.schedule || med.schedule.length === 0) continue;

            for (const slot of med.schedule) {
                if (!slot || !slot.includes(':')) continue;

                const scheduledTime = slotToDate(slot);
                const minutesPast = (now - scheduledTime) / 60000; // minutes since scheduled time

                // Only process slots that are in the past today
                if (minutesPast <= 0) continue;

                // ── Check if already taken/skipped ───────────────────────
                const alreadyHandled = await isDoseTakenOrSkipped(
                    group._id, med._id, med.name, todayStart
                );

                // Fetch admin (creator) user — guard against unpopulated/null creator
                const creatorId = group.creator?._id || group.creator;
                if (!creatorId) continue;
                const adminUser = await User.findById(creatorId);

                // ── Tier 1: +1.5 hours → warn admin ─────────────────────
                if (minutesPast >= 90 && !alreadyHandled) {
                    const isNew = await recordAlert(med._id, group._id, slot, todayStr, '1.5h_admin');
                    if (isNew) {
                        const msg = `⚠️ *MediGrate Alert — Late Dose*\n\n` +
                            `Group: *${group.name}*\n` +
                            `Medicine: *${med.name}*\n` +
                            `Scheduled: *${slot}*\n` +
                            `Date: *${todayStr}*\n\n` +
                            `This dose is now *1.5 hours late* and has not been marked as taken or skipped.\n` +
                            `Please remind the patient to take their medicine.`;
                        await sendWhatsApp(adminUser?.phone, msg);
                        console.log(`[DoseAlert] ⚡ 1.5h alert → admin (${group.name} / ${med.name})`);
                    }
                }

                // ── Tier 2: +2.5 hours → alert all members ───────────────
                if (minutesPast >= 150 && !alreadyHandled) {
                    const isNew = await recordAlert(med._id, group._id, slot, todayStr, '2.5h_members');
                    if (isNew) {
                        const memberUsers = await User.find({ _id: { $in: group.members } });
                        const msg = `🔔 *MediGrate — Dose Reminder*\n\n` +
                            `Group: *${group.name}*\n` +
                            `Medicine: *${med.name}*\n` +
                            `Scheduled: *${slot}* on *${todayStr}*\n\n` +
                            `This dose is *2.5 hours late* and still not marked. ` +
                            `Please help ensure ${med.name} is taken — or mark it as skipped if intentional.`;
                        await sendWhatsAppBulk(memberUsers, msg);
                        console.log(`[DoseAlert] 🔔 2.5h alert → ${memberUsers.length} members (${group.name} / ${med.name})`);
                    }
                }

                // ── Tier 3: +3.5 hours → mark missed + alert admin ───────
                if (minutesPast >= 210 && !alreadyHandled) {
                    const isNew = await recordAlert(med._id, group._id, slot, todayStr, '3.5h_missed');
                    if (isNew) {
                        // Write missed ActivityLog (shows as red in the UI)
                        await ActivityLog.create({
                            groupId: group._id,
                            userId: null,
                            userName: 'System Alert',
                            action: `${med.name} was missed (Scheduled for ${slot})`,
                            status: 'missed',
                            timestamp: new Date()
                        });

                        // WhatsApp to admin
                        const msg = `❌ *MediGrate — Dose MISSED*\n\n` +
                            `Group: *${group.name}*\n` +
                            `Medicine: *${med.name}*\n` +
                            `Scheduled: *${slot}* on *${todayStr}*\n\n` +
                            `This dose was *not taken or skipped* within 3.5 hours of the scheduled time.\n` +
                            `It has been automatically marked as *MISSED* in the activity log.\n\n` +
                            `Time of alert: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
                        await sendWhatsApp(adminUser?.phone, msg);
                        console.log(`[DoseAlert] ❌ 3.5h MISSED alert → admin (${group.name} / ${med.name})`);
                    }
                }
            }
        }
    }

    console.log('[DoseAlert] Check complete.');
}

// ─── Start Scheduler ─────────────────────────────────────────────────────────

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

function startDoseAlertScheduler() {
    console.log('[DoseAlert] Scheduler started — checking every 5 minutes.');

    // Run immediately on startup, then every 5 min
    runDoseAlertCheck().catch(err =>
        console.error('[DoseAlert] Error on startup check:', err)
    );

    setInterval(() => {
        runDoseAlertCheck().catch(err =>
            console.error('[DoseAlert] Error during scheduled check:', err)
        );
    }, CHECK_INTERVAL_MS);
}

module.exports = { startDoseAlertScheduler, runDoseAlertCheck };
