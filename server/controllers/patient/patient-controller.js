// server/controllers/patient/patient-controller.js
const Report = require('../../models/Report');
const Group = require('../../models/Group');
const mongoose = require('mongoose');

const getPatientDashboard = async (req, res) => {
  try {
    const userId = req.user?.id || req.query?.userId;

    // If userId exists and is a valid ObjectId, fetch real data. Otherwise return empty structure.
    let reports = [];
    let groups = [];
    
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      reports = await Report.find({ user: userId }).sort({ createdAt: -1 }).limit(5);
      groups = await Group.find({ members: userId }).limit(3);
    }

    const data = {
      healthScore: reports.length > 0 ? Math.min(100, 75 + (reports.length * 2)) : 0,
      recentReports: reports.map(r => ({
        id: r._id,
        title: r.filename || r.reportType || 'Medical Report',
        date: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString()
      })),
      family: groups.map(g => ({
        id: g._id,
        name: g.name,
        relation: 'Family Group',
        latestStatus: `Created: ${g.createdAt.toLocaleDateString()}`
      })),
      recommendations: reports.length > 0 
        ? ["Stay hydrated and maintain routine checks", "Review your latest report insights"]
        : ["No recent history. Upload a report to start getting AI insights."],
      quickSummary: reports.length > 0 
        ? `You have ${reports.length} report(s) on file. Your dashboard is tracking your metrics.` 
        : "Welcome to MediGrated! Add a report or join a family group to start."
    };

    res.json({ success: true, data });
  } catch (err) {
    console.error('getPatientDashboard error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getPatientDashboard };
