const User = require('../models/User');
const ApiError = require('../utils/apiError');
const jwt = require('jsonwebtoken');

exports.updateCompetitionRegistration = async (req, res, next) => {
    try {
        const {
            category,
            age,
            biography,
            photoUrl
        } = req.body;

        // Check if payment is approved
        const user = await User.findById(req.user.id);
        if (user.paymentStatus !== 'approved') {
            return next(new ApiError('Please complete payment before registration', 400));
        }

        // Update competition registration
        user.competitionRegistration = {
            status: 'completed',
            category,
            age,
            biography,
            photoUrl,
            completedAt: Date.now()
        };

        await user.save();

        // Send confirmation email
        await sendCompetitionRegistrationEmail(user);

        res.status(200).json({
            success: true,
            message: 'Competition registration completed successfully',
            data: user.competitionRegistration
        });
    } catch (error) {
        next(error);
    }
};

exports.getCompetitionRegistration = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        res.status(200).json({
            success: true,
            data: user.competitionRegistration
        });
    } catch (error) {
        next(error);
    }
}; 