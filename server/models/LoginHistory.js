const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userModel: { type: String, required: true, enum: ['User', 'Advocate', 'Admin'] },
    email: { type: String, required: true },
    loginTime: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
