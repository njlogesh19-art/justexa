const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Advocate = require('../models/Advocate');

// POST /api/upload/picture — saves base64 profile picture to DB
// Accepts JSON body: { picture: "data:image/jpeg;base64,..." }
router.post('/picture', authMiddleware, async (req, res) => {
    try {
        const { picture } = req.body;
        if (!picture) return res.status(400).json({ message: 'No picture data provided.' });

        // Basic validation: must be a base64 data URI
        if (!picture.startsWith('data:image/')) {
            return res.status(400).json({ message: 'Invalid image format. Must be a base64 data URI.' });
        }

        // Limit size: ~2MB (base64 is ~1.33x the binary size)
        if (picture.length > 3 * 1024 * 1024) {
            return res.status(413).json({ message: 'Image too large. Maximum size is 2MB.' });
        }

        const userId = req.user.id;
        const role = req.user.role;

        let updated;
        if (role === 'advocate') {
            updated = await Advocate.findByIdAndUpdate(
                userId,
                { $set: { picture } },
                { new: true }
            ).select('-password');
        } else {
            updated = await User.findByIdAndUpdate(
                userId,
                { $set: { picture } },
                { new: true }
            ).select('-password');
        }

        if (!updated) return res.status(404).json({ message: 'User not found.' });

        res.json({ message: 'Profile picture updated.', picture });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating picture.' });
    }
});

module.exports = router;
