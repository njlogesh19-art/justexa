const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth');

// Helper: build stable conversation ID
const buildConvId = (a, b) => [a.toString(), b.toString()].sort().join('_');

// GET /api/messages/conversations — list all conversation partners for current user
router.get('/conversations', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        // Find all messages involving this user
        const msgs = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }]
        }).sort({ createdAt: -1 });

        // Build a unique list of the last message per conversation
        const seen = new Map();
        for (const msg of msgs) {
            const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            const otherModel = msg.senderId === userId ? msg.receiverModel : msg.senderModel;
            if (!seen.has(otherId)) {
                seen.set(otherId, { otherId, otherModel, lastMessage: msg });
            }
        }

        // Populate other party details and return a flat shape for the frontend
        const User = require('../models/User');
        const Advocate = require('../models/Advocate');
        const conversations = await Promise.all(
            Array.from(seen.values()).map(async ({ otherId, otherModel, lastMessage }) => {
                let other = null;
                if (otherModel === 'User') {
                    other = await User.findById(otherId).select('name email');
                } else {
                    other = await Advocate.findById(otherId).select('name email specialization city');
                }
                const unreadCount = await Message.countDocuments({
                    senderId: otherId, receiverId: userId, read: false
                });
                // Return flat shape expected by Inbox.js
                return {
                    partnerId: otherId,
                    name: other ? other.name : 'Deleted User',
                    email: other ? other.email : '',
                    otherModel,
                    lastMessage,
                    lastMessageTime: lastMessage ? lastMessage.createdAt : null,
                    unreadCount,
                };
            })
        );

        res.json({ conversations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/messages/:otherPartyId — get messages in a conversation
router.get('/:otherPartyId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherPartyId } = req.params;
        const conversationId = buildConvId(userId, otherPartyId);

        const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

        // Mark incoming messages as read
        await Message.updateMany(
            { conversationId, receiverId: userId, read: false },
            { $set: { read: true } }
        );

        // Get other party info
        const User = require('../models/User');
        const Advocate = require('../models/Advocate');
        let otherParty = await User.findById(otherPartyId).select('name email');
        let otherModel = 'User';
        if (!otherParty) {
            otherParty = await Advocate.findById(otherPartyId).select('name email specialization city');
            otherModel = 'Advocate';
        }

        res.json({ messages, otherParty, otherModel });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// POST /api/messages/:otherPartyId — send a message
router.post('/:otherPartyId', authMiddleware, async (req, res) => {
    try {
        const senderId = req.user.id;
        const senderModel = req.user.role === 'advocate' ? 'Advocate' : 'User';
        const { otherPartyId } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Message text is required.' });
        }

        // Determine receiver model (opposite of sender)
        const User = require('../models/User');
        const Advocate = require('../models/Advocate');
        let receiverModel = 'User';
        const isUser = await User.findById(otherPartyId);
        if (!isUser) {
            const isAdv = await Advocate.findById(otherPartyId);
            if (isAdv) receiverModel = 'Advocate';
        }

        const conversationId = buildConvId(senderId, otherPartyId);

        const message = new Message({
            conversationId,
            senderId,
            senderModel,
            receiverId: otherPartyId,
            receiverModel,
            text: text.trim()
        });
        await message.save();

        res.status(201).json({ message });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
