const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Advocate = require('../models/Advocate');
const Case = require('../models/Case');
const authMiddleware = require('../middleware/auth');

// ─── Admin Credentials (pre-hashed, no env dependency) ───────────────────────
const ADMIN_EMAIL = 'n.j.logesh06@gmail.com';
// bcrypt hash of: Leo@1905
const ADMIN_PASS_HASH = '$2a$10$5XOGNTpwbzmsnOCfny1zQeMi8BHLhJ4fVszNyDO7isIJEgVGetw/2';

// ─── Admin Login ──────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            return res.status(401).json({ message: 'Invalid admin credentials.' });
        }
        const isMatch = await bcrypt.compare(password, ADMIN_PASS_HASH);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid admin credentials.' });
        }
        const secret = process.env.JWT_SECRET || 'justexa_fallback_secret_2024';
        const token = jwt.sign({ id: 'admin', role: 'admin', email: ADMIN_EMAIL }, secret, { expiresIn: '8h' });
        res.json({ token, role: 'admin', user: { name: 'Administrator', email: ADMIN_EMAIL } });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ message: 'Server error during admin login.' });
    }
});

// Admin Case model — extended with CNR and all tracker fields
const adminCaseSchema = new mongoose.Schema({
    cnr_no: { type: String, trim: true, uppercase: true, default: '' },
    case_title: { type: String, required: true, trim: true },
    client_name: { type: String, required: true, trim: true },
    petitioner: { type: String, trim: true, default: '' },
    respondent: { type: String, trim: true, default: '' },
    case_type: { type: String, required: true, trim: true },
    court_name: { type: String, required: true, trim: true },
    judge_name: { type: String, trim: true, default: '' },
    next_hearing: { type: Date },
    filing_date: { type: Date },
    status: { type: String, required: true, enum: ['Pending', 'Ongoing', 'Closed'], default: 'Pending' }
}, { timestamps: true });

const AdminCase = mongoose.models.AdminCase || mongoose.model('AdminCase', adminCaseSchema);


// ─── Advocates ────────────────────────────────────────────────────────────────

// GET all advocates
router.get('/advocates', async (req, res) => {
    try {
        const advocates = await Advocate.find().select('-password').sort({ createdAt: -1 });
        res.json({ advocates });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// POST add advocate
router.post('/add-advocate', async (req, res) => {
    try {
        const { name, bar_council_id, email, mobile_no, specialization, experience, city } = req.body;
        if (!name || !bar_council_id || !email || !specialization) {
            return res.status(400).json({ message: 'Name, Bar Council ID, Email, and Specialization are required.' });
        }
        const existing = await Advocate.findOne({ $or: [{ email }, { bar_council_id }] });
        if (existing) return res.status(409).json({ message: 'Advocate with this email or Bar Council ID already exists.' });

        const advocate = new Advocate({
            name, bar_council_id, email,
            mobile_no: mobile_no || '',
            specialization,
            experience: Number(experience) || 0,
            experience_years: Number(experience) || 0,
            city: city || '',
            password: ''
        });
        await advocate.save();
        const saved = advocate.toObject();
        delete saved.password;
        res.status(201).json({ message: 'Advocate added successfully.', advocate: saved });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT update advocate
router.put('/advocates/:id', async (req, res) => {
    try {
        const { name, bar_council_id, email, mobile_no, specialization, experience, city } = req.body;
        const updated = await Advocate.findByIdAndUpdate(
            req.params.id,
            { $set: { name, bar_council_id, email, mobile_no, specialization, experience: Number(experience) || 0, experience_years: Number(experience) || 0, city } },
            { new: true }
        ).select('-password');
        if (!updated) return res.status(404).json({ message: 'Advocate not found.' });
        res.json({ message: 'Advocate updated.', advocate: updated });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// DELETE advocate
router.delete('/advocates/:id', async (req, res) => {
    try {
        const deleted = await Advocate.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Advocate not found.' });
        res.json({ message: 'Advocate deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// ─── Cases ────────────────────────────────────────────────────────────────────

// GET all admin cases
router.get('/cases', async (req, res) => {
    try {
        const cases = await AdminCase.find().sort({ createdAt: -1 });
        res.json({ cases });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// POST add case
router.post('/add-case', async (req, res) => {
    try {
        const { cnr_no, case_title, client_name, petitioner, respondent,
            case_type, court_name, judge_name, next_hearing, filing_date, status } = req.body;
        if (!case_title || !client_name || !case_type || !court_name) {
            return res.status(400).json({ message: 'Case Title, Client Name, Case Type, and Court Name are required.' });
        }
        const newCase = new AdminCase({
            cnr_no: cnr_no || '', case_title, client_name,
            petitioner: petitioner || client_name,
            respondent: respondent || '',
            case_type, court_name,
            judge_name: judge_name || '',
            next_hearing: next_hearing || null,
            filing_date: filing_date || null,
            status: status || 'Pending'
        });
        await newCase.save();

        // ── Sync to Case collection so users can find it by CNR ──
        if (cnr_no && cnr_no.trim()) {
            await Case.findOneAndUpdate(
                { cnr_no: cnr_no.trim().toUpperCase() },
                {
                    cnr_no: cnr_no.trim().toUpperCase(),
                    status: status || 'Pending',
                    petitioner: petitioner || client_name,
                    respondent: respondent || 'Respondent',
                    court_name,
                    next_hearing: next_hearing || null,
                    case_type,
                    filing_date: filing_date || null,
                    judge_name: judge_name || '',
                },
                { upsert: true, new: true }
            );
        }

        res.status(201).json({ message: 'Case added successfully.', case: newCase });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT update case
router.put('/cases/:id', async (req, res) => {
    try {
        const { cnr_no, case_title, client_name, petitioner, respondent,
            case_type, court_name, judge_name, next_hearing, filing_date, status } = req.body;
        const updated = await AdminCase.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    cnr_no: cnr_no || '', case_title, client_name,
                    petitioner: petitioner || '', respondent: respondent || '',
                    case_type, court_name, judge_name: judge_name || '',
                    next_hearing: next_hearing || null, filing_date: filing_date || null, status
                }
            },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Case not found.' });

        // ── Sync update to Case collection ──
        if (cnr_no && cnr_no.trim()) {
            await Case.findOneAndUpdate(
                { cnr_no: cnr_no.trim().toUpperCase() },
                {
                    status: status || 'Pending',
                    petitioner: petitioner || client_name,
                    respondent: respondent || 'Respondent',
                    court_name,
                    next_hearing: next_hearing || null,
                    case_type,
                    filing_date: filing_date || null,
                    judge_name: judge_name || '',
                },
                { upsert: true, new: true }
            );
        }

        res.json({ message: 'Case updated.', case: updated });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// DELETE case
router.delete('/cases/:id', async (req, res) => {
    try {
        const deleted = await AdminCase.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Case not found.' });
        // Also remove from Case collection if it has a CNR
        if (deleted.cnr_no) {
            await Case.deleteOne({ cnr_no: deleted.cnr_no.toUpperCase() });
        }
        res.json({ message: 'Case deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
