const mongoose = require('mongoose');

const caseNotificationSchema = new mongoose.Schema({
    cnr_no: { type: String, required: true, uppercase: true, trim: true },
    case_title: { type: String },           // petitioner vs respondent
    next_hearing: { type: Date, required: true },
    notify_email: { type: String, required: true },
    notify_phone: { type: String, default: '' },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notified: { type: Boolean, default: false },  // flipped to true once email sent
    createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate subscriptions for same CNR + email
caseNotificationSchema.index({ cnr_no: 1, notify_email: 1 }, { unique: true });

module.exports = mongoose.model('CaseNotification', caseNotificationSchema);
