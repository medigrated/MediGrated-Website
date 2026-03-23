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
    // Common profile fields
    avatar: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer-not-to-say'],
        default: null
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    location: {
        type: String,
        default: null
    },
    bio: {
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
        default: null
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