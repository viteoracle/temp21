const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// Upload profile photo
exports.uploadProfilePhoto = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new ApiError('Please upload an image', 400));
        }

        const user = await User.findById(req.user.id);

        // Delete old profile photo if exists
        if (user.competitionRegistration.profilePhoto?.public_id) {
            await deleteFromCloudinary(user.competitionRegistration.profilePhoto.public_id);
        }

        // Upload new photo
        const result = await uploadToCloudinary(req.file, 'profile-photos');

        user.competitionRegistration.profilePhoto = {
            public_id: result.public_id,
            url: result.url
        };

        await user.save();

        res.status(200).json({
            success: true,
            data: user.competitionRegistration.profilePhoto
        });
    } catch (error) {
        next(error);
    }
};

// Upload competition photos
exports.uploadCompetitionPhotos = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return next(new ApiError('Please upload at least one image', 400));
        }

        const user = await User.findById(req.user.id);
        const uploadPromises = req.files.map(file =>
            uploadToCloudinary(file, 'competition-photos')
        );

        const results = await Promise.all(uploadPromises);

        const photos = results.map((result, index) => ({
            public_id: result.public_id,
            url: result.url,
            caption: req.body.captions ? req.body.captions[index] : ''
        }));

        user.competitionRegistration.photos.push(...photos);
        await user.save();

        res.status(200).json({
            success: true,
            data: photos
        });
    } catch (error) {
        next(error);
    }
};

// Delete competition photo
exports.deleteCompetitionPhoto = async (req, res, next) => {
    try {
        const { photoId } = req.params;
        const user = await User.findById(req.user.id);

        const photo = user.competitionRegistration.photos.id(photoId);
        if (!photo) {
            return next(new ApiError('Photo not found', 404));
        }

        await deleteFromCloudinary(photo.public_id);
        photo.remove();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Photo deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}; 