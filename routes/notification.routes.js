const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user.model');
const { Resend } = require('resend'); // <-- Ensures Resend is imported

// POST /api/notifications/subscribe
// Saves a push notification subscription to the user's profile.
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
// Saves the user's notification preferences (email/push for classes, tests, etc.).
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

// GET /api/notifications/test-email
// This route is for testing email sending functionality.
router.get('/test-email', auth, async (req, res) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const userEmail = req.user.email; // Gets email of the logged-in user

    await resend.emails.send({
      from: process.env.EMAIL_FROM, // Your 'from' email from .env
      to: userEmail,
      subject: '✅ Test Email from AttendanceTracker Pro',
      html: '<h1>Success!</h1><p>If you are seeing this, your email notifications are configured correctly.</p>',
    });

    res.status(200).send('Test email sent successfully to ' + userEmail);

  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).send('Failed to send test email. Check server logs.');
  }
});

module.exports = router;