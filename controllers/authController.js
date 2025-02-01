const User = require('../models/User');
const ApiError = require('../utils/apiError');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/email');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const user = await User.create({
            name,
            email,
            password,
        });

        const token = signToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user,
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new ApiError('Please provide email and password', 400));
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return next(new ApiError('Invalid credentials', 401));
        }

        const token = signToken(user._id);

        res.status(200).json({
            success: true,
            token,
        });
    } catch (error) {
        next(error);
    }
};

exports.updatePaymentId = async (req, res, next) => {
    try {
        const { paymentId } = req.body;
        const userId = req.user.id; // Assuming you have user ID in req.user after authentication

        const user = await User.findByIdAndUpdate(userId, { paymentId }, { new: true });

        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        next(error);
    }
}; 