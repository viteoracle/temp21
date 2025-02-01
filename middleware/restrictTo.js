const ApiError = require('../utils/apiError');

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ApiError('You do not have permission to perform this action', 403));
        }
        next();
    };
}; 