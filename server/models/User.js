const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: '' },
    googleId: { type: String, default: '' },
    picture: { type: String, default: '' },
    role: { type: String, default: 'user', enum: ['user'] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
