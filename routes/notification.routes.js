const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user.model');

// POST /api/notifications/subscribe
router.post('/subscribe', auth, async (req, res) => {
    const subscription = req.body;
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $addToSet: { push_subscriptions: subscription } // Use $addToSet to avoid duplicates
        });
        res.status(201).json({ message: 'Subscription saved.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/notifications/preferences
router.put('/preferences', auth, async (req, res) => {
    const preferences = req.body;
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $set: { notification_preferences: preferences }
        });
        res.json({ message: 'Preferences updated.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;