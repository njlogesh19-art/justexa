const mongoose = require('mongoose');

const messageRequestSchema = new mongoose.Schema({
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromUserName: { type: String, required: true },
    fromUserEmail: { type: String, required: true },
    toAdvocate: { type: mongoose.Schema.Types.ObjectId, ref: 'Advocate', required: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    message: { type: String, default: 'I would like to start a conversation with you.' },
}, { timestamps: true });

// Prevent duplicate pending requests
messageRequestSchema.index({ fromUser: 1, toAdvocate: 1 }, { unique: false });

module.exports = mongoose.model('MessageRequest', messageRequestSchema);
