const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'approved', 'rejected'],
        default: 'pending'
    },
    paymentId: {
        type: String,
        unique: true,
        sparse: true
    },
    paymentAmount: {
        type: Number,
        default: 0
    },
    paymentDate: {
        type: Date
    },
    paymentNotes: {
        type: String
    },
    competitionRegistration: {
        status: {
            type: String,
            enum: ['pending', 'completed'],
            default: 'pending'
        },
        category: String,
        age: Number,
        biography: String,
        photoUrl: String,
        completedAt: Date,
        socialMediaLinks: {
            instagram: String,
            facebook: String,
            twitter: String
        },
        measurements: {
            height: Number,
            weight: Number,
            bust: Number,
            waist: Number,
            hips: Number
        },
        talents: [String],
        achievements: [String],
        votesCount: {
            type: Number,
            default: 0
        },
        isPubliclyVisible: {
            type: Boolean,
            default: false
        },
        approvalDate: Date,
        photos: [{
            public_id: String,
            url: String,
            caption: String
        }],
        profilePhoto: {
            public_id: String,
            url: String
        },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, {
    timestamps: true,
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 