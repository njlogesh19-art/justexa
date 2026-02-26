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

// Update logged-in user/advocate profile
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { id, role } = req.user;
        const { name, location, mobile_no, city, bio, consultation_fee, picture } = req.body;

        const updates = {};

        if (role === 'user') {
            if (name) updates.name = name.trim();
            if (location !== undefined) updates.location = location.trim();
            // picture: base64 data URI, validated loosely
            if (picture !== undefined) {
                if (picture === '' || picture.startsWith('data:image/')) {
                    updates.picture = picture;
                }
            }
            const updated = await User.findByIdAndUpdate(id, { $set: updates }, { new: true }).select('-password');
            if (!updated) return res.status(404).json({ message: 'User not found.' });
            return res.json({ message: 'Profile updated successfully.', profile: updated });
        }

        if (role === 'advocate') {
            if (name) updates.name = name.trim();
            if (mobile_no !== undefined) updates.mobile_no = mobile_no.trim();
            if (city !== undefined) updates.city = city.trim();
            if (bio !== undefined) updates.bio = bio.trim();
            if (consultation_fee !== undefined) updates.consultation_fee = Number(consultation_fee);
            if (picture !== undefined) {
                if (picture === '' || picture.startsWith('data:image/')) {
                    updates.picture = picture;
                }
            }
            const updated = await Advocate.findByIdAndUpdate(id, { $set: updates }, { new: true }).select('-password');
            if (!updated) return res.status(404).json({ message: 'Advocate not found.' });
            return res.json({ message: 'Profile updated successfully.', profile: updated });
        }

        return res.status(400).json({ message: 'Unknown role.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while updating profile.' });
    }
});

module.exports = router;
