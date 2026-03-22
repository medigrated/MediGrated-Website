// server/routes/auth/auth-routes.js
const express = require('express');
const { registerUser, loginUser, logoutUser, authMiddleware, updateProfile, changePassword } = require('../../controllers/auth/auth-controller');


const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.get('/check-auth', authMiddleware, async (req, res) => {
    try {
        const User = require('../../models/User');
        const fullUser = await User.findById(req.user.id).select('-password').lean();
        const u = fullUser || req.user;
        res.status(200).json({
            success: true,
            message: 'User is authenticated',
            user: { id: u._id || u.id, email: u.email, role: u.role, name: u.name || '', phone: u.phone || '', location: u.location || '', age: u.age || null, bloodType: u.bloodType || null, allergies: u.allergies || null, medicalHistory: u.medicalHistory || null, emergencyContact: u.emergencyContact || null, specialization: u.specialization || null, licenseNumber: u.licenseNumber || null, experience: u.experience || null, clinic: u.clinic || null, department: u.department || null }
        });
    } catch (_) {
        res.status(200).json({
            success: true,
            message: 'User is authenticated',
            user: { id: req.user.id, email: req.user.email, role: req.user.role, name: '', phone: '', location: '', age: null, bloodType: null, allergies: null, medicalHistory: null, emergencyContact: null, specialization: null, licenseNumber: null, experience: null, clinic: null, department: null }
        });
    }
});

module.exports = router;