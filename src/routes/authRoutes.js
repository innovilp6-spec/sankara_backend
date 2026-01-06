const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected user routes
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

// Admin only routes
router.get('/admin/pending-approvals', adminMiddleware, authController.getPendingApprovals);
router.post('/admin/approve-user', adminMiddleware, authController.approveUser);
router.post('/admin/reject-user', adminMiddleware, authController.rejectUser);

module.exports = router;
