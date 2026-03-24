// server/models/Report.js
const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who uploaded it
  filename: { type: String, required: true },   // original filename
  storedFilename: { type: String, required: true }, // filename on disk / cloud
  mimeType: { type: String },
  size: { type: Number },
  storagePath: { type: String }, // local path or cloud url
  reportType: { type: String, enum: ['blood', 'xray', 'other'], default: 'other' },
  parsedData: { type: mongoose.Schema.Types.Mixed }, // parsed JSON from the scanner (lab values, findings, etc.)
  notes: { type: String }, // optional human notes
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
