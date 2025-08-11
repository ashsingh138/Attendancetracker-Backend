const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Assignment = require('../models/assignment.model');

// POST /api/assignments (Create new assignment)
router.post('/', auth, async (req, res) => {
    try {
        const newAssignment = new Assignment({ ...req.body, user_id: req.user.id });
        await newAssignment.save();
        res.status(201).json(newAssignment);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// PUT /api/assignments/:id (Update an assignment)
router.put('/:id', auth, async (req, res) => {
    try {
        const assignment = await Assignment.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
        res.json(assignment);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// DELETE /api/assignments/:id (Delete an assignment)
router.delete('/:id', auth, async (req, res) => {
    try {
        const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
        res.json({ message: 'Assignment deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;