const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Advocate = require('../models/Advocate');
const authMiddleware = require('../middleware/auth');

// Get logged-in user/advocate profile
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { id, role } = req.user;
        let profile = null;

        if (role === 'user') {
            profile = await User.findById(id).select('-password');
        } else if (role === 'advocate') {
            profile = await Advocate.findById(id).select('-password');
        }

        if (!profile) return res.status(404).json({ message: 'Profile not found.' });
        res.json({ profile, role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching profile.' });
    }
});

// Update logged-in user profile (name, location)
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { id, role } = req.user;
        if (role !== 'user') {
            return res.status(403).json({ message: 'Only users can update their profile here.' });
        }

        const { name, location } = req.body;
        if (!name && !location) {
            return res.status(400).json({ message: 'Provide at least one field to update.' });
        }

        const updates = {};
        if (name) updates.name = name.trim();
        if (location) updates.location = location.trim();

        const updated = await User.findByIdAndUpdate(id, { $set: updates }, { new: true }).select('-password');
        if (!updated) return res.status(404).json({ message: 'User not found.' });

        res.json({ message: 'Profile updated successfully.', profile: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while updating profile.' });
    }
});

module.exports = router;
