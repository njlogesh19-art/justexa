const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderModel: { type: String, required: true, enum: ['User', 'Advocate'] },
    receiverId: { type: String, required: true },
    receiverModel: { type: String, required: true, enum: ['User', 'Advocate'] },
    text: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false }
}, { timestamps: true });

// Helper to build a stable conversationId regardless of who sends
messageSchema.statics.buildConversationId = function (idA, idB) {
    return [idA, idB].sort().join('_');
};

module.exports = mongoose.model('Message', messageSchema);
