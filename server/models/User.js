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
    },
    // Common profile fields
    location: {
        type: String,
        default: null
    },
    // Patient-specific fields
    age: {
        type: Number,
        default: null
    },
    bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        default: null
    },
    allergies: {
        type: String,
        default: null
    },
    medicalHistory: {
        type: String,
        default: null
    },
    emergencyContact: {
        type: String,
        default: null
    },
    // Doctor-specific fields
    specialization: {
        type: String,
        default: null
    },
    licenseNumber: {
        type: String,
        default: null
    },
    experience: {
        type: Number,
        default: null // years of experience
    },
    clinic: {
        type: String,
        default: null
    },
    // Admin-specific fields
    department: {
        type: String,
        default: null
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;