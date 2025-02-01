const express = require('express');
const router = express.Router();
const {
    updateCompetitionRegistration,
    getCompetitionRegistration
} = require('../controllers/competitionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/register', updateCompetitionRegistration);
router.get('/registration-status', getCompetitionRegistration);

module.exports = router; 