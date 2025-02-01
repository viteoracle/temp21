const express = require('express');
const router = express.Router();
const {
    getMe,
    updateMe,
    updatePaymentStatus,
    getPaymentStatus,
    submitPayment
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Protect all routes after this middleware
router.use(protect);

router.get('/me', getMe);
router.patch('/updateme', updateMe);
router.get('/payment-status', getPaymentStatus);
router.post('/submit-payment', submitPayment);

// Admin only routes
router.patch('/payment-status/:userId', updatePaymentStatus);

module.exports = router; 