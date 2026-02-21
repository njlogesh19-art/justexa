const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Advocate = require('../models/Advocate');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Password validation
const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
};

// Register User
router.post('/register/user', async (req, res) => {
    try {
        const { name, location, email, password } = req.body;
        if (!name || !location || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({ message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character.' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(409).json({ message: 'Email already registered.' });

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ name, location, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id, role: 'user', email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, role: 'user', user: { id: user._id, name: user.name, email: user.email, location: user.location } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// Register Advocate
router.post('/register/advocate', async (req, res) => {
    try {
        const { name, bar_council_id, email, specialization, experience, password } = req.body;
        if (!name || !bar_council_id || !email || !specialization || !experience || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({ message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character.' });
        }
        const existingAdvocate = await Advocate.findOne({ email });
        if (existingAdvocate) return res.status(409).json({ message: 'Email already registered.' });
        const existingBarId = await Advocate.findOne({ bar_council_id });
        if (existingBarId) return res.status(409).json({ message: 'Bar Council ID already registered.' });

        const hashedPassword = await bcrypt.hash(password, 12);
        const advocate = new Advocate({ name, bar_council_id, email, specialization, experience: Number(experience), password: hashedPassword });
        await advocate.save();

        const token = jwt.sign({ id: advocate._id, role: 'advocate', email: advocate.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token, role: 'advocate',
            user: { id: advocate._id, name: advocate.name, email: advocate.email, specialization: advocate.specialization, experience: advocate.experience, bar_council_id: advocate.bar_council_id }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// Login (checks both User and Advocate collections)
router.post('/login', async (req, res) => {
    try {
        const { email, password, loginType } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

        let account = null;
        let role = null;

        if (loginType === 'user') {
            account = await User.findOne({ email });
            role = 'user';
        } else if (loginType === 'advocate') {
            account = await Advocate.findOne({ email });
            role = 'advocate';
        } else {
            account = await User.findOne({ email });
            if (account) { role = 'user'; }
            else {
                account = await Advocate.findOne({ email });
                if (account) role = 'advocate';
            }
        }

        if (!account) return res.status(401).json({ message: 'Invalid email or password.' });

        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });

        const token = jwt.sign({ id: account._id, role, email: account.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        const userData = {
            id: account._id,
            name: account.name,
            email: account.email,
            role,
            ...(role === 'user' ? { location: account.location } : {
                bar_council_id: account.bar_council_id,
                specialization: account.specialization,
                experience: account.experience
            })
        };

        res.json({ token, role, user: userData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Google OAuth Login — receives userInfo fetched client-side via access_token
router.post('/google', async (req, res) => {
    try {
        // Frontend sends the userInfo object fetched from Google's userinfo endpoint
        const { email, name, picture, sub: googleId } = req.body;

        if (!email) return res.status(400).json({ message: 'Google account email is required.' });

        // Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
            // Create a new user from Google profile
            user = new User({
                name: name || email.split('@')[0],
                email,
                location: '',
                password: await bcrypt.hash((googleId || email) + process.env.JWT_SECRET, 10),
                googleId: googleId || '',
                picture: picture || ''
            });
            await user.save();
        } else if (!user.googleId && googleId) {
            // Link Google account to existing user
            user.googleId = googleId;
            if (picture && !user.picture) user.picture = picture;
            await user.save();
        }

        const token = jwt.sign({ id: user._id, role: 'user', email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            role: 'user',
            user: { id: user._id, name: user.name, email: user.email, location: user.location, picture: user.picture }
        });
    } catch (err) {
        console.error('Google auth error:', err);
        res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required.' });

        let account = await User.findOne({ email });
        let role = 'user';
        if (!account) {
            account = await Advocate.findOne({ email });
            role = 'advocate';
        }

        if (!account) {
            return res.status(404).json({ message: 'User/Advocate not exist' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        res.json({ message: 'OTP sent successfully.', otp, role, email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, role, newPassword } = req.body;
        if (!email || !role || !newPassword) return res.status(400).json({ message: 'All fields required.' });
        if (!validatePassword(newPassword)) {
            return res.status(400).json({ message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        if (role === 'user') {
            await User.findOneAndUpdate({ email }, { password: hashedPassword });
        } else {
            await Advocate.findOneAndUpdate({ email }, { password: hashedPassword });
        }
        res.json({ message: 'Password reset successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
