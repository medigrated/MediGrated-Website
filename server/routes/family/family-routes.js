const express = require('express');
const router = express.Router();
const {
    createGroup, joinGroup, getGroups, getGroupDetails,
    deleteGroup, removeMember, leaveGroup, getMembers,
    addMedicine, markTaken, skipDose, deleteMedicine, editMedicine, refillMedicine,
    updatePhone, getUserAlerts
} = require('../../controllers/family/family-controller');
const { authMiddleware } = require('../../controllers/auth/auth-controller');

router.get('/', authMiddleware, getGroups);
router.get('/alerts', authMiddleware, getUserAlerts);
router.post('/', authMiddleware, createGroup);
router.post('/join', authMiddleware, joinGroup);
router.get('/:id', authMiddleware, getGroupDetails);
router.delete('/:id', authMiddleware, deleteGroup);                        // Creator: delete entire group
router.post('/:id/leave', authMiddleware, leaveGroup);                     // Member: leave (transfers ownership)
router.delete('/:id/members/:memberId', authMiddleware, removeMember);     // Creator: remove a member
router.post('/:id/medicine', authMiddleware, addMedicine);
router.post('/:id/taken/:medId', authMiddleware, markTaken);
router.post('/:id/skip/:medId', authMiddleware, skipDose);
router.delete('/:id/medicine/:medId', authMiddleware, deleteMedicine);
router.put('/:id/medicine/:medId', authMiddleware, editMedicine);
router.post('/:id/refill/:medId', authMiddleware, refillMedicine);        // Dedicated refill
router.get('/:id/members', authMiddleware, getMembers);
router.put('/me/phone', authMiddleware, updatePhone);  // User: save WhatsApp phone number

module.exports = router;
