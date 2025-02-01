const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { sendPaymentStatusEmail } = require('../utils/email');

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

exports.updateMe = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.user.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { paymentStatus, paymentId, paymentNotes } = req.body;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to update payment status', 403));
        }

        const user = await User.findById(userId);

        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        // Update payment information
        user.paymentStatus = paymentStatus;
        user.paymentId = paymentId;
        user.paymentNotes = paymentNotes;

        if (paymentStatus === 'approved') {
            user.paymentDate = Date.now();
        }

        await user.save();

        // Send email notification
        await sendPaymentStatusEmail(user, paymentStatus);

        res.status(200).json({
            success: true,
            message: `Payment status updated to ${paymentStatus}`,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

exports.getPaymentStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: {
                paymentStatus: user.paymentStatus,
                paymentId: user.paymentId,
                paymentDate: user.paymentDate,
                paymentAmount: user.paymentAmount
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.submitPayment = async (req, res, next) => {
    try {
        const { paymentId, amount } = req.body;
        const user = await User.findById(req.user.id);

        user.paymentId = paymentId;
        user.paymentAmount = amount;
        user.paymentStatus = 'processing';

        await user.save();

        // Send email notification
        await sendPaymentStatusEmail(user, 'processing');

        res.status(200).json({
            success: true,
            message: 'Payment submitted successfully',
            data: {
                paymentStatus: user.paymentStatus,
                paymentId: user.paymentId
            }
        });
    } catch (error) {
        next(error);
    }
}; 