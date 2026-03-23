// server/routes/auth/auth-routes.js
const express = require('express');
const { registerUser, loginUser, logoutUser, authMiddleware, updateProfile, changePassword, uploadAvatar } = require('../../controllers/auth/auth-controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), uploadAvatar);
router.get('/check-auth', authMiddleware, async (req, res) => {
    try {
        const User = require('../../models/User');
        const fullUser = await User.findById(req.user.id).select('-password').lean();
        res.status(200).json({
            success: true,
            message: 'User is authenticated',
            user: { id: u._id || u.id, email: u.email, role: u.role, name: u.name || '', phone: u.phone || '', gender: u.gender || null, dateOfBirth: u.dateOfBirth || null, location: u.location || '', bio: u.bio || null, age: u.age || null, bloodType: u.bloodType || null, allergies: u.allergies || null, medicalHistory: u.medicalHistory || null, emergencyContact: u.emergencyContact || null, specialization: u.specialization || null, licenseNumber: u.licenseNumber || null, experience: u.experience || null, clinic: u.clinic || null, department: u.department || null, avatar: u.avatar || null }
        });
    } catch (_) {
        res.status(200).json({
            success: true,
            message: 'User is authenticated',
            user: { id: req.user.id, email: req.user.email, role: req.user.role, name: '', phone: '', gender: null, dateOfBirth: null, location: '', bio: null, age: null, bloodType: null, allergies: null, medicalHistory: null, emergencyContact: null, specialization: null, licenseNumber: null, experience: null, clinic: null, department: null, avatar: null }
        });
    }
});

module.exports = router;