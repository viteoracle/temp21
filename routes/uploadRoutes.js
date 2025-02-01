const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    uploadProfilePhoto,
    uploadCompetitionPhotos,
    deleteCompetitionPhoto
} = require('../controllers/uploadController');

router.use(protect);

router.post('/profile-photo',
    upload.single('photo'),
    uploadProfilePhoto
);

router.post('/competition-photos',
    upload.array('photos', 5), // Max 5 photos
    uploadCompetitionPhotos
);

router.delete('/competition-photos/:photoId',
    deleteCompetitionPhoto
);

module.exports = router; 