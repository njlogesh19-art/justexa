const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const MessageRequest = require('../models/MessageRequest');
const Message = require('../models/Message');

// POST /api/message-requests — user sends a chat request to an advocate
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { advocateId, message } = req.body;
        if (!advocateId) return res.status(400).json({ message: 'advocateId is required.' });

        // Check if there's already a pending/accepted request
        const existing = await MessageRequest.findOne({
            fromUser: req.user.id,
            toAdvocate: advocateId,
            status: { $in: ['pending', 'accepted'] }
        });
        if (existing) {
            if (existing.status === 'accepted') {
                return res.status(200).json({ message: 'Already connected.', status: 'accepted', requestId: existing._id });
            }
            return res.status(200).json({ message: 'Request already sent, awaiting advocacy acceptance.', status: 'pending', requestId: existing._id });
        }

        // Look up user name from database (JWT only has id, role, email)
        const User = require('../models/User');
        const userDoc = await User.findById(req.user.id).select('name email');
        const userName = userDoc?.name || 'Unknown User';
        const userEmail = userDoc?.email || req.user.email;

        const request = await MessageRequest.create({
            fromUser: req.user.id,
            fromUserName: userName,
            fromUserEmail: userEmail,
            toAdvocate: advocateId,
            message: message || 'I would like to start a chat with you.',
        });

        res.status(201).json({ message: 'Chat request sent successfully!', requestId: request._id, status: 'pending' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/message-requests/my-status/:advocateId — user checks their request status
router.get('/my-status/:advocateId', authMiddleware, async (req, res) => {
    try {
        const request = await MessageRequest.findOne({
            fromUser: req.user.id,
            toAdvocate: req.params.advocateId,
        }).sort({ createdAt: -1 });

        if (!request) return res.json({ status: 'none' });
        res.json({ status: request.status, requestId: request._id });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/message-requests/accepted — user gets all accepted requests (for notifications)
router.get('/accepted', authMiddleware, async (req, res) => {
    try {
        const requests = await MessageRequest.find({
            fromUser: req.user.id,
            status: 'accepted',
        }).sort({ updatedAt: -1 });

        // Populate advocate info for the notification message
        const Advocate = require('../models/Advocate');
        const populated = await Promise.all(requests.map(async (r) => {
            const adv = await Advocate.findById(r.toAdvocate).select('name specialization');
            return {
                _id: r._id,
                advocateId: r.toAdvocate,
                advocateName: adv ? adv.name : 'An Advocate',
                advocateSpec: adv ? adv.specialization : '',
                acceptedAt: r.updatedAt,
            };
        }));

        res.json({ accepted: populated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/message-requests/incoming — advocate sees all incoming pending requests
router.get('/incoming', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'advocate') return res.status(403).json({ message: 'Advocates only.' });
        const requests = await MessageRequest.find({
            toAdvocate: req.user.id,
            status: 'pending'
        }).sort({ createdAt: -1 });
        res.json({ requests });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/message-requests/:id/accept — advocate accepts request and seeds initial message
router.put('/:id/accept', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'advocate') return res.status(403).json({ message: 'Advocates only.' });
        const request = await MessageRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found.' });
        if (request.toAdvocate.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized.' });

        request.status = 'accepted';
        await request.save();

        // Seed an initial welcome message so the conversation appears in inbox immediately
        const convId = [request.fromUser.toString(), request.toAdvocate.toString()].sort().join('_');
        const existingMsg = await Message.findOne({ conversationId: convId });
        if (!existingMsg) {
            await Message.create({
                conversationId: convId,
                senderId: request.toAdvocate.toString(),
                senderModel: 'Advocate',
                receiverId: request.fromUser.toString(),
                receiverModel: 'User',
                text: `Hi ${request.fromUserName}! Your chat request has been accepted. How can I help you?`,
            });
        }

        res.json({ message: 'Request accepted. Conversation started.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/message-requests/:id/reject — advocate rejects request
router.put('/:id/reject', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'advocate') return res.status(403).json({ message: 'Advocates only.' });
        const request = await MessageRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found.' });
        if (request.toAdvocate.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized.' });

        request.status = 'rejected';
        await request.save();
        res.json({ message: 'Request rejected.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
