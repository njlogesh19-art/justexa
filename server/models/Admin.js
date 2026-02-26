const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, default: 'Administrator' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin', enum: ['admin'] }
}, { timestamps: true });

// Store admin credentials in the dedicated 'admin' collection
module.exports = mongoose.model('Admin', adminSchema, 'admin');
