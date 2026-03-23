const Group = require('../../models/Group');
const Medicine = require('../../models/Medicine');
const ActivityLog = require('../../models/ActivityLog');
const User = require('../../models/User');

// ─── Helpers ────────────────────────────────────────────────────────────────

const getUser = async (userId) => (userId ? User.findById(userId) : null);

const logActivity = async (groupId, userId, userName, action, status = 'consumed', timestamp = null) => {
  const payload = { groupId, userId, userName, action, status };
  if (timestamp) payload.timestamp = timestamp;
  const log = new ActivityLog(payload);
  await log.save();
  return log;
};

// ─── Group CRUD ──────────────────────────────────────────────────────────────

const createGroup = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Group name is required' });

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const group = new Group({ name, code, creator: userId, members: [userId] });
    await group.save();
    return res.json({ success: true, group });
  } catch (err) {
    console.error('createGroup error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const joinGroup = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Code is required' });

    const group = await Group.findOne({ code: code.toUpperCase() });
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    if (group.members.map(m => m.toString()).includes(userId?.toString())) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    group.members.push(userId);
    await group.save();
    return res.json({ success: true, group });
  } catch (err) {
    console.error('joinGroup error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getGroups = async (req, res) => {
  try {
    const userId = req.user?.id;
    const groups = await Group.find({ members: userId }).sort({ createdAt: -1 });
    return res.json({ success: true, groups });
  } catch (err) {
    console.error('getGroups error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Creator: delete entire group and all its data
const deleteGroup = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    if (group.creator.toString() !== userId?.toString()) {
      return res.status(403).json({ success: false, message: 'Only the group creator can delete this group' });
    }

    await Medicine.deleteMany({ groupId });
    await ActivityLog.deleteMany({ groupId });
    await Group.findByIdAndDelete(groupId);

    return res.json({ success: true, message: 'Group deleted successfully' });
  } catch (err) {
    console.error('deleteGroup error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Creator: remove a specific member
const removeMember = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: groupId, memberId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    if (group.creator.toString() !== userId?.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator can remove members' });
    }
    if (memberId === userId?.toString()) {
      return res.status(400).json({ success: false, message: 'Creator cannot remove themselves. Use "Leave Group" instead.' });
    }

    group.members = group.members.filter(m => m.toString() !== memberId);
    await group.save();

    const removedUser = await User.findById(memberId);
    await logActivity(groupId, userId, req.user?.name || 'Preview User',
      `removed ${removedUser?.name || 'a member'} from the group`);

    return res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    console.error('removeMember error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Leave group (transfers ownership to a random remaining member if creator leaves)
const leaveGroup = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isCreator = group.creator.toString() === userId?.toString();
    group.members = group.members.filter(m => m.toString() !== userId?.toString());

    if (isCreator) {
      if (group.members.length > 0) {
        // Transfer ownership to a random remaining member
        const randomIdx = Math.floor(Math.random() * group.members.length);
        group.creator = group.members[randomIdx];
        await group.save();
        const newOwner = await User.findById(group.creator);
        await logActivity(groupId, group.creator, 'System Alert',
          `Ownership transferred to ${newOwner?.name || 'a member'} after creator left`);
      } else {
        // No members left — delete the group
        await Medicine.deleteMany({ groupId });
        await ActivityLog.deleteMany({ groupId });
        await Group.findByIdAndDelete(groupId);
        return res.json({ success: true, message: 'Group deleted (no members remaining)' });
      }
    } else {
      await group.save();
    }

    return res.json({ success: true, message: 'Left the group successfully' });
  } catch (err) {
    console.error('leaveGroup error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMembers = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    return res.json({ success: true, members: group.members, creator: group.creator?.toString() });
  } catch (err) {
    console.error('getMembers error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Group Details (with fixed missed-dose dedup) ────────────────────────────

const getGroupDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const medicines = await Medicine.find({ groupId: id }).populate('addedBy', 'name').sort({ createdAt: -1 });
    const now = new Date();
    const currentTimeStr = now.toTimeString().substring(0, 5); // "HH:MM"

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

    for (let med of medicines) {
      const schedule = [...med.schedule].sort(); // e.g. ["08:00", "14:00", "18:00"]

      // Fetch today's logs for this medicine ONCE (not per schedule slot)
      const todayLogs = await ActivityLog.find({
        groupId: id,
        timestamp: { $gte: startOfDay }
      }).lean();

      let nextDoseTime = null;

      for (let i = 0; i < schedule.length; i++) {
        const time = schedule[i];
        const [hour, min] = time.split(':').map(Number);
        const schedDate = new Date(); schedDate.setHours(hour, min, 0, 0);

        if (schedDate < now) {
          // If the medicine was created after this dose's scheduled time today, skip it entirely.
          // This prevents false "missed" alerts for doses that occurred before the medicine was registered.
          const createdTime = med.createdAt ? new Date(med.createdAt).getTime() : 0;
          const schedTime = schedDate.getTime();
          if (createdTime > schedTime) {
            continue;
          }

          // ── Missed-dose threshold ──────────────────────────────────────────
          // A dose is "missed" only once we're 2 hours before the NEXT dose.
          // For the last dose of the day, it's missed 2 hours after the dose time.
          let missedThreshold;
          if (i + 1 < schedule.length) {
            // There is a next dose — threshold = next dose time - 2 hours
            const [nh, nm] = schedule[i + 1].split(':').map(Number);
            const nextDate = new Date(); nextDate.setHours(nh, nm, 0, 0);
            missedThreshold = new Date(nextDate.getTime() - 2 * 60 * 60 * 1000);
          } else {
            // Last dose of the day — threshold = dose time + 2 hours
            missedThreshold = new Date(schedDate.getTime() + 2 * 60 * 60 * 1000);
          }

          if (now >= missedThreshold) {
            // Check if already consumed today for this medicine (quick in-memory check)
            const alreadyConsumed = todayLogs.some(log =>
              log.status === 'consumed' &&
              log.action.toLowerCase().includes(`marked ${med.name.toLowerCase()} as consumed`)
            );

            // Check if missed log already exists for exact this slot
            const alreadyMissed = todayLogs.some(log =>
              log.status === 'missed' &&
              log.action.toLowerCase() === `${med.name.toLowerCase()} was missed (scheduled for ${time})`
            );

            if (!alreadyConsumed && !alreadyMissed) {
              await logActivity(id, group.creator, 'System Alert',
                `${med.name} was missed (Scheduled for ${time})`, 'missed');
            }
          }
        }

        if (!nextDoseTime && time > currentTimeStr) nextDoseTime = time;
      }

      med._doc.nextDose = nextDoseTime || (schedule.length > 0 ? schedule[0] : null);
      med._doc.daysLeft = med.timesPerDay > 0 ? Math.floor(med.remainingAmount / med.timesPerDay) : 0;
    }

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const activities = await ActivityLog.find({
      groupId: id,
      timestamp: { $gte: tenDaysAgo }
    }).sort({ timestamp: -1 });

    return res.json({ success: true, group, medicines, activities });
  } catch (err) {
    console.error('getGroupDetails error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


// ─── Medicine Actions ────────────────────────────────────────────────────────

const addMedicine = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: groupId } = req.params;
    const { name, totalAmount, timesPerDay, schedule, notes, alreadyTakenFirstDose } = req.body;

    const group = await Group.findById(groupId);
    const finalUserId = userId || group?.creator;
    const user = await getUser(userId);

    const initialAmount = parseInt(totalAmount);
    const firstDoseTaken = alreadyTakenFirstDose === true || alreadyTakenFirstDose === 'true';
    const startingRemaining = firstDoseTaken ? Math.max(0, initialAmount - 1) : initialAmount;

    let logTime = new Date();
    const validSchedule = (schedule || []).filter(t => t && t.trim() && t.includes(':'));
    
    if (firstDoseTaken && validSchedule.length > 0) {
      const now = logTime.getTime();
      let nearestTime = null;
      let smallestDiff = Infinity;

      for (const t of validSchedule) {
        const [h, m] = t.split(':').map(Number);
        const candidate = new Date();
        candidate.setHours(h, m, 0, 0);
        const diff = Math.abs(now - candidate.getTime());
        if (diff < smallestDiff) {
          smallestDiff = diff;
          nearestTime = t;
        }
      }

      if (nearestTime) {
        const [h, m] = nearestTime.split(':').map(Number);
        logTime.setHours(h, m, 0, 0);
      }
    }

    // Format nearest dose time for log text (e.g. "8:45 PM")
    const doseTimeLabel = firstDoseTaken
      ? logTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      : null;

    const medicine = new Medicine({ 
      groupId, name, totalAmount: initialAmount, remainingAmount: startingRemaining, 
      timesPerDay, schedule, notes: notes || '', addedBy: finalUserId 
    });
    
    if (firstDoseTaken) {
      medicine.lastTakenAt = logTime;
    }
    
    await medicine.save();

    // Use current time for activity log (so it appears at top of feed)
    await logActivity(groupId, finalUserId, user?.name || 'Preview User', `added medicine ${name}`);
    
    if (firstDoseTaken) {
      await logActivity(groupId, finalUserId, user?.name || 'Preview User',
        `marked ${name} as consumed (${doseTimeLabel} dose)`, 'consumed');
    }

    return res.json({ success: true, medicine });
  } catch (err) {
    console.error('addMedicine error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const markTaken = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: groupId, medId } = req.params;

    const medicine = await Medicine.findById(medId);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    if (medicine.remainingAmount <= 0) return res.status(400).json({ success: false, message: 'No supply remaining' });

    medicine.remainingAmount -= 1;
    medicine.lastTakenAt = new Date();
    await medicine.save();

    const group = await Group.findById(groupId);
    const finalUserId = userId || group?.creator;
    const user = await getUser(userId);

    const log = await logActivity(groupId, finalUserId, user?.name || 'Preview User', `marked ${medicine.name} as consumed`, 'consumed');
    return res.json({ success: true, medicine, log });
  } catch (err) {
    console.error('markTaken error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Skip a dose intentionally (doctor advised, etc.)
const skipDose = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: groupId, medId } = req.params;
    const { reason } = req.body;

    const medicine = await Medicine.findById(medId);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });

    const group = await Group.findById(groupId);
    const finalUserId = userId || group?.creator;
    const user = await getUser(userId);

    const actionText = reason
      ? `skipped ${medicine.name} — ${reason}`
      : `skipped ${medicine.name} (intentional)`;

    const log = await logActivity(groupId, finalUserId, user?.name || 'Preview User', actionText, 'skipped');
    return res.json({ success: true, log });
  } catch (err) {
    console.error('skipDose error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteMedicine = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: groupId, medId } = req.params;

    const medicine = await Medicine.findById(medId);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });

    const medName = medicine.name;
    await Medicine.findByIdAndDelete(medId);

    const group = await Group.findById(groupId);
    const finalUserId = userId || group?.creator;
    const user = await getUser(userId);

    await logActivity(groupId, finalUserId, user?.name || 'Preview User', `removed medicine ${medName}`);
    return res.json({ success: true, message: 'Medicine deleted' });
  } catch (err) {
    console.error('deleteMedicine error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const editMedicine = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: groupId, medId } = req.params;
    const { name, totalAmount, timesPerDay, schedule, notes } = req.body;

    const medicine = await Medicine.findById(medId);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });

    if (name !== undefined) medicine.name = name;
    if (totalAmount !== undefined) medicine.totalAmount = totalAmount;
    if (timesPerDay !== undefined) medicine.timesPerDay = Math.max(1, timesPerDay);
    if (schedule !== undefined) medicine.schedule = schedule;
    if (notes !== undefined) medicine.notes = notes;
    await medicine.save();

    const group = await Group.findById(groupId);
    const finalUserId = userId || group?.creator;
    const user = await getUser(userId);
    await logActivity(groupId, finalUserId, user?.name || 'Preview User', `updated schedule for ${medicine.name}`);

    return res.json({ success: true, medicine });
  } catch (err) {
    console.error('editMedicine error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Dedicated refill — keeps history clean and separate from "edit"
const refillMedicine = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: groupId, medId } = req.params;
    const { addAmount } = req.body;

    if (!addAmount || addAmount <= 0) return res.status(400).json({ success: false, message: 'addAmount must be positive' });

    const medicine = await Medicine.findById(medId);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });

    medicine.remainingAmount += parseInt(addAmount);
    medicine.totalAmount += parseInt(addAmount);
    await medicine.save();

    const group = await Group.findById(groupId);
    const finalUserId = userId || group?.creator;
    const user = await getUser(userId);

    await logActivity(groupId, finalUserId, user?.name || 'Preview User',
      `refilled ${medicine.name} (+${addAmount} tablets)`);

    return res.json({ success: true, medicine });
  } catch (err) {
    console.error('refillMedicine error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Update Phone for WhatsApp Alerts ───────────────────────────────────────

const updatePhone = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { phone } = req.body; // E.164 format: +919876543210
    if (!phone || !/^\+\d{7,15}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone. Use E.164 format: +919876543210' });
    }
    await User.findByIdAndUpdate(userId, { phone });
    res.json({ success: true, message: 'Phone number saved. You will receive WhatsApp alerts.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getUserAlerts = async (req, res) => {
  try {
    const userId = req.user?.id;
    const groups = await Group.find({ members: userId });
    const groupIds = groups.map(g => g._id);

    // Get recent activities indicating a missed or skipped dose across all joined groups
    const alerts = await ActivityLog.find({
      groupId: { $in: groupIds },
      status: { $in: ['missed', 'skipped'] }
    }).sort({ timestamp: -1 }).limit(10).populate('groupId', 'name');

    return res.json({ success: true, alerts });
  } catch (err) {
    console.error('getUserAlerts error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createGroup, joinGroup, getGroups, getGroupDetails,
  deleteGroup, removeMember, leaveGroup, getMembers,
  addMedicine, markTaken, skipDose, deleteMedicine, editMedicine, refillMedicine,
  updatePhone, getUserAlerts
};
