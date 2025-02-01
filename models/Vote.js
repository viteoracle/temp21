const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    contestant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    voter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ipAddress: String,
    votedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure one vote per voter per contestant
voteSchema.index({ contestant: 1, voter: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema); 