const express = require('express');
const router = express.Router();
const {
    getContestants,
    getContestantDetails,
    voteForContestant,
    getContestantStats
} = require('../controllers/contestantController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getContestants);
router.get('/stats', getContestantStats);
router.get('/:id', getContestantDetails);

// Protected routes
router.post('/:id/vote', protect, voteForContestant);

module.exports = router; 