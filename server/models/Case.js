const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    cnr_no: { type: String, required: true, unique: true, trim: true, uppercase: true },
    status: { type: String, required: true, trim: true },
    petitioner: { type: String, required: true, trim: true },
    respondent: { type: String, required: true, trim: true },
    court_name: { type: String, required: true, trim: true },
    next_hearing: { type: Date, required: true },
    case_type: { type: String, trim: true },
    filing_date: { type: Date },
    judge_name: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema);
