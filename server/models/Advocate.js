const mongoose = require('mongoose');

const advocateSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    bar_council_id: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile_no: { type: String, trim: true, default: '' },
    specialization: { type: String, required: true, trim: true },
    experience: { type: Number, min: 0, default: 0 },
    experience_years: { type: Number, min: 0, default: 0 },
    city: { type: String, trim: true, default: '' },
    consultation_fee: { type: Number, min: 0, default: 0 },
    bio: { type: String, trim: true, default: '' },
    password: { type: String, default: '' },
    picture: { type: String, default: '' },
    role: { type: String, default: 'advocate', enum: ['advocate'] },
    status: { type: String, default: 'approved', enum: ['pending', 'approved', 'rejected'] }
}, { timestamps: true });

module.exports = mongoose.model('Advocate', advocateSchema);
