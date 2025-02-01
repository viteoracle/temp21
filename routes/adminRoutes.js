const express = require('express');
const router = express.Router();
const {
    getDashboardOverview,
    getContestantsList,
    updateContestantStatus,
    getContestantDetails,
    getPaymentStats,
    getRevenueAnalytics,
    bulkUpdateContestants,
    getCategories,
    getVotingAnalytics,
    exportContestantData
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/restrictTo');

// Protect all routes and restrict to admin
router.use(protect);
router.use(restrictTo('admin'));

// Dashboard and overview routes
router.get('/dashboard', getDashboardOverview);
router.get('/revenue-analytics', getRevenueAnalytics);
router.get('/categories', getCategories);
router.get('/voting-analytics', getVotingAnalytics);

// Contestant management routes
router.get('/contestants', getContestantsList);
router.get('/contestants/:id', getContestantDetails);
router.patch('/contestants/:id', updateContestantStatus);
router.post('/contestants/bulk-update', bulkUpdateContestants);
router.get('/contestants/export', exportContestantData);

// Payment and statistics routes
router.get('/payment-stats', getPaymentStats);

module.exports = router; 