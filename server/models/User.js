const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin'],
        default: 'patient'
    },
    // Phone in E.164 format e.g. +919876543210 — used for Twilio WhatsApp alerts
    phone: {
        type: String,
        default: null
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;