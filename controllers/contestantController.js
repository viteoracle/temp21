const User = require('../models/User');
const Vote = require('../models/Vote');
const ApiError = require('../utils/apiError');

// Get all approved contestants with filters and sorting
exports.getContestants = async (req, res, next) => {
    try {
        const {
            category,
            sortBy = 'approvalDate',
            order = 'desc',
            page = 1,
            limit = 10,
            search
        } = req.query;

        const query = {
            'paymentStatus': 'approved',
            'competitionRegistration.status': 'completed',
            'competitionRegistration.isPubliclyVisible': true
        };

        // Add category filter if provided
        if (category) {
            query['competitionRegistration.category'] = category;
        }

        // Add search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'competitionRegistration.biography': { $regex: search, $options: 'i' } }
            ];
        }

        // Create sort object
        const sortOptions = {};
        switch (sortBy) {
            case 'votes':
                sortOptions['competitionRegistration.votesCount'] = order === 'desc' ? -1 : 1;
                break;
            case 'recent':
                sortOptions['competitionRegistration.approvalDate'] = order === 'desc' ? -1 : 1;
                break;
            case 'name':
                sortOptions['name'] = order === 'desc' ? -1 : 1;
                break;
            default:
                sortOptions['competitionRegistration.approvalDate'] = -1;
        }

        const contestants = await User.find(query)
            .select('name email competitionRegistration')
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

// Get single contestant details
exports.getContestantDetails = async (req, res, next) => {
    try {
        const contestant = await User.findOne({
            _id: req.params.id,
            paymentStatus: 'approved',
            'competitionRegistration.status': 'completed',
            'competitionRegistration.isPubliclyVisible': true
        }).select('name email competitionRegistration');

        if (!contestant) {
            return next(new ApiError('Contestant not found', 404));
        }

        res.status(200).json({
            success: true,
            data: contestant
        });
    } catch (error) {
        next(error);
    }
};

// Vote for a contestant
exports.voteForContestant = async (req, res, next) => {
    try {
        const contestant = await User.findById(req.params.id);

        if (!contestant || contestant.paymentStatus !== 'approved') {
            return next(new ApiError('Contestant not found', 404));
        }

        // Check if user has already voted for this contestant
        const existingVote = await Vote.findOne({
            contestant: contestant._id,
            voter: req.user.id
        });

        if (existingVote) {
            return next(new ApiError('You have already voted for this contestant', 400));
        }

        // Create vote record
        await Vote.create({
            contestant: contestant._id,
            voter: req.user.id,
            ipAddress: req.ip
        });

        // Increment vote count
        contestant.competitionRegistration.votesCount += 1;
        await contestant.save();

        res.status(200).json({
            success: true,
            message: 'Vote recorded successfully',
            data: {
                votesCount: contestant.competitionRegistration.votesCount
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get contestant statistics
exports.getContestantStats = async (req, res, next) => {
    try {
        const stats = await User.aggregate([
            {
                $match: {
                    paymentStatus: 'approved',
                    'competitionRegistration.status': 'completed',
                    'competitionRegistration.isPubliclyVisible': true
                }
            },
            {
                $group: {
                    _id: '$competitionRegistration.category',
                    count: { $sum: 1 },
                    avgVotes: { $avg: '$competitionRegistration.votesCount' },
                    totalVotes: { $sum: '$competitionRegistration.votesCount' }
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