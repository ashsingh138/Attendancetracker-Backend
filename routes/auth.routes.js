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
// POST /api/auth/login
router.post('/login', async (req, res) => {
    console.log('--- LOGIN ROUTE HIT ---');
    try {
        const { email, password } = req.body;
        console.log('Step 1: Finding user by email:', email);
        const user = await User.findOne({ email });

        if (!user) {
            console.log('Step 2: User not found. Sending 401.');
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        console.log('Step 2: User found:', user.email);

        console.log('Step 3: Comparing password...');
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Step 4: Password does not match. Sending 401.');
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        console.log('Step 4: Password matches.');

        const payload = { id: user._id, email: user.email };
        
        // This next log is very important. It checks if the secret key exists.
        console.log('Step 5: Preparing to sign token. JWT_SECRET exists:', !!process.env.JWT_SECRET);
        
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        console.log('Step 6: Token signed successfully.'); // If we see this, the token was created.

        res.json({ token });
        console.log('Step 7: JSON response sent.');

    } catch (error) {
        console.error('--- LOGIN CATCH BLOCK ERROR ---', error);
        res.status(500).json({ message: 'An error occurred.' });
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