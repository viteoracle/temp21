const User = require('../models/User');
const Vote = require('../models/Vote');
const ApiError = require('../utils/apiError');
const { sendPaymentStatusEmail } = require('../utils/email');

// Get dashboard overview
exports.getDashboardOverview = async (req, res, next) => {
    try {
        const overview = await User.aggregate([
            {
                $facet: {
                    'paymentStatus': [
                        {
                            $group: {
                                _id: '$paymentStatus',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    'registrationStatus': [
                        {
                            $group: {
                                _id: '$competitionRegistration.status',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    'categoryStats': [
                        {
                            $match: {
                                'competitionRegistration.category': { $exists: true }
                            }
                        },
                        {
                            $group: {
                                _id: '$competitionRegistration.category',
                                count: { $sum: 1 },
                                totalVotes: { $sum: '$competitionRegistration.votesCount' }
                            }
                        }
                    ],
                    'recentRegistrations': [
                        {
                            $match: {
                                'competitionRegistration.status': 'completed'
                            }
                        },
                        {
                            $sort: { 'competitionRegistration.completedAt': -1 }
                        },
                        {
                            $limit: 5
                        },
                        {
                            $project: {
                                name: 1,
                                email: 1,
                                paymentStatus: 1,
                                registrationDate: '$competitionRegistration.completedAt'
                            }
                        }
                    ]
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: overview[0]
        });
    } catch (error) {
        next(error);
    }
};

// Get contestants list with filters
exports.getContestantsList = async (req, res, next) => {
    try {
        const {
            status,
            paymentStatus,
            category,
            search,
            sortBy = 'createdAt',
            order = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        const query = {};

        // Add filters
        if (status) {
            query['competitionRegistration.status'] = status;
        }
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }
        if (category) {
            query['competitionRegistration.category'] = category;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Create sort object
        const sortOptions = {};
        switch (sortBy) {
            case 'votes':
                sortOptions['competitionRegistration.votesCount'] = order === 'desc' ? -1 : 1;
                break;
            case 'name':
                sortOptions.name = order === 'desc' ? -1 : 1;
                break;
            case 'paymentDate':
                sortOptions.paymentDate = order === 'desc' ? -1 : 1;
                break;
            default:
                sortOptions.createdAt = order === 'desc' ? -1 : 1;
        }

        const contestants = await User.find(query)
            .select('name email paymentStatus paymentId paymentAmount competitionRegistration createdAt')
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                contestants,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    totalContestants: total
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update contestant status
exports.updateContestantStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { paymentStatus, notes, isPubliclyVisible } = req.body;

        const contestant = await User.findById(id);

        if (!contestant) {
            return next(new ApiError('Contestant not found', 404));
        }

        // Update payment status if provided
        if (paymentStatus) {
            contestant.paymentStatus = paymentStatus;
            contestant.paymentNotes = notes;

            if (paymentStatus === 'approved') {
                contestant.paymentDate = Date.now();
                contestant.competitionRegistration.approvalDate = Date.now();
            }

            // Send email notification
            await sendPaymentStatusEmail(contestant, paymentStatus);
        }

        // Update visibility if provided
        if (typeof isPubliclyVisible !== 'undefined') {
            contestant.competitionRegistration.isPubliclyVisible = isPubliclyVisible;
        }

        await contestant.save();

        res.status(200).json({
            success: true,
            message: 'Contestant status updated successfully',
            data: contestant
        });
    } catch (error) {
        next(error);
    }
};

// Get contestant detailed information
exports.getContestantDetails = async (req, res, next) => {
    try {
        const contestant = await User.findById(req.params.id)
            .select('-password');

        if (!contestant) {
            return next(new ApiError('Contestant not found', 404));
        }

        // Get vote history
        const votes = await Vote.find({ contestant: contestant._id })
            .populate('voter', 'name email')
            .sort('-votedAt');

        res.status(200).json({
            success: true,
            data: {
                contestant,
                votes
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get payment statistics
exports.getPaymentStats = async (req, res, next) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: '$paymentStatus',
                    count: { $sum: 1 },
                    totalAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$paymentStatus', 'approved'] },
                                '$paymentAmount',
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

// Get revenue analytics
exports.getRevenueAnalytics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { paymentStatus: 'approved' };

        if (startDate && endDate) {
            query.paymentDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const revenueStats = await User.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        month: { $month: '$paymentDate' },
                        year: { $year: '$paymentDate' }
                    },
                    totalRevenue: { $sum: '$paymentAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: revenueStats
        });
    } catch (error) {
        next(error);
    }
};

// Bulk update contestant status
exports.bulkUpdateContestants = async (req, res, next) => {
    try {
        const { contestantIds, paymentStatus, notes } = req.body;

        const result = await User.updateMany(
            { _id: { $in: contestantIds } },
            {
                $set: {
                    paymentStatus,
                    paymentNotes: notes,
                    ...(paymentStatus === 'approved' && {
                        paymentDate: Date.now(),
                        'competitionRegistration.approvalDate': Date.now()
                    })
                }
            }
        );

        // Send emails to all updated contestants
        const contestants = await User.find({ _id: { $in: contestantIds } });
        await Promise.all(
            contestants.map(contestant => sendPaymentStatusEmail(contestant, paymentStatus))
        );

        res.status(200).json({
            success: true,
            message: `Updated ${result.modifiedCount} contestants`,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Get category management
exports.getCategories = async (req, res, next) => {
    try {
        const categories = await User.aggregate([
            {
                $match: {
                    'competitionRegistration.category': { $exists: true }
                }
            },
            {
                $group: {
                    _id: '$competitionRegistration.category',
                    contestantCount: { $sum: 1 },
                    approvedCount: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'approved'] }, 1, 0]
                        }
                    },
                    totalVotes: { $sum: '$competitionRegistration.votesCount' }
                }
            },
            {
                $project: {
                    category: '$_id',
                    contestantCount: 1,
                    approvedCount: 1,
                    totalVotes: 1,
                    approvalRate: {
                        $multiply: [
                            { $divide: ['$approvedCount', '$contestantCount'] },
                            100
                        ]
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

// Get voting analytics
exports.getVotingAnalytics = async (req, res, next) => {
    try {
        const { category, timeframe } = req.query;
        let dateFilter = {};

        if (timeframe) {
            const now = new Date();
            switch (timeframe) {
                case 'day':
                    dateFilter = {
                        $gte: new Date(now.setDate(now.getDate() - 1))
                    };
                    break;
                case 'week':
                    dateFilter = {
                        $gte: new Date(now.setDate(now.getDate() - 7))
                    };
                    break;
                case 'month':
                    dateFilter = {
                        $gte: new Date(now.setMonth(now.getMonth() - 1))
                    };
                    break;
            }
        }

        const query = dateFilter ? { votedAt: dateFilter } : {};
        if (category) {
            query['contestant.competitionRegistration.category'] = category;
        }

        const votingStats = await Vote.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'contestant',
                    foreignField: '_id',
                    as: 'contestant'
                }
            },
            { $unwind: '$contestant' },
            { $match: query },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$votedAt' } },
                        category: '$contestant.competitionRegistration.category'
                    },
                    voteCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: votingStats
        });
    } catch (error) {
        next(error);
    }
};

// Export contestant data
exports.exportContestantData = async (req, res, next) => {
    try {
        const { format, status } = req.query;
        const query = {};

        if (status) {
            query.paymentStatus = status;
        }

        const contestants = await User.find(query)
            .select('name email paymentStatus paymentAmount competitionRegistration createdAt');

        let exportData;
        if (format === 'csv') {
            // Convert to CSV format
            const fields = ['name', 'email', 'paymentStatus', 'category', 'votes'];
            const csv = contestants.map(c => ({
                name: c.name,
                email: c.email,
                paymentStatus: c.paymentStatus,
                category: c.competitionRegistration?.category,
                votes: c.competitionRegistration?.votesCount
            }));

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=contestants.csv');
            // Implementation of CSV conversion would go here
        } else {
            // Default to JSON
            exportData = contestants;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=contestants.json');
        }

        res.status(200).json({
            success: true,
            data: exportData
        });
    } catch (error) {
        next(error);
    }
}; 