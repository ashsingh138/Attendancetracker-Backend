const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
        if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long.'});
        
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User with this email already exists.' });
        
        user = new User({ email, password });
        await user.save();

        res.status(201).json({ message: 'Sign up successful! Please log in.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        const payload = { id: user._id, email: user.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token });
    } catch (error) {
        // vvv ADD THIS LINE vvv
        console.error('TOKEN SIGNING ERROR:', error); 
        // ^^^ ADD THIS LINE ^^^
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/auth/update-password
router.put('/update-password', auth, async (req, res) => {
    try {
        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found." });

        user.password = password;
        await user.save();

        res.json({ message: "Password updated successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;