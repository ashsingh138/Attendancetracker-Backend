const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Test = require('../models/test.model');

// POST /api/tests (Create new test)
router.post('/', auth, async (req, res) => {
    try {
        const newTest = new Test({ ...req.body, user_id: req.user.id });
        await newTest.save();
        res.status(201).json(newTest);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// PUT /api/tests/:id (Update a test)
router.put('/:id', auth, async (req, res) => {
    try {
        const test = await Test.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!test) return res.status(404).json({ message: 'Test not found' });
        res.json(test);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// DELETE /api/tests/:id (Delete a test)
router.delete('/:id', auth, async (req, res) => {
    try {
        const test = await Test.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
        if (!test) return res.status(404).json({ message: 'Test not found' });
        res.json({ message: 'Test deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;