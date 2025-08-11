const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/user.model');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Multer configuration for avatar uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });


// GET /api/profile/me (Get current logged-in user's data)
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: "User not found." });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/profile (Update user profile data)
router.put('/', auth, async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id, 
            { $set: req.body },
            { new: true, runValidators: true }
        ).select('-password');
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/profile/avatar (Upload a new avatar)
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: 'Please upload a file.' });
        }
        // Construct the URL to the uploaded file
        const avatarUrl = `${req.protocol}://${req.get('host')}/${req.file.path}`;
        const user = await User.findByIdAndUpdate(req.user.id, { avatar_url: avatarUrl }, { new: true }).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;