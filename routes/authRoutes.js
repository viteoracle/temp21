const express = require('express');
const router = express.Router();
const { register, login, updatePaymentId } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/updatePaymentId', protect, updatePaymentId);

module.exports = router; 