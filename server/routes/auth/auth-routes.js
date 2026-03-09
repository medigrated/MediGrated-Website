// server/routes/auth/auth-routes.js
const express = require('express');
const { registerUser, loginUser, logoutUser, authMiddleware } = require('../../controllers/auth/auth-controller');


const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/check-auth', authMiddleware, async (req, res) => {
    try {
        const User = require('../../models/User');
        const fullUser = await User.findById(req.user.id).select('-password').lean();
        const u = fullUser || req.user;
        res.status(200).json({
            success: true,
            message: 'User is authenticated',
            user: { id: u._id || u.id, email: u.email, role: u.role, name: u.name || '' }
        });
    } catch (_) {
        res.status(200).json({
            success: true,
            message: 'User is authenticated',
            user: { id: req.user.id, email: req.user.email, role: req.user.role, name: '' }
        });
    }
});

module.exports = router;