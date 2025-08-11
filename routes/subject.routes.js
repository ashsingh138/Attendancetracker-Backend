const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subject = require('../models/subject.model');
const Test = require('../models/test.model');
const Assignment = require('../models/assignment.model');
const AttendanceRecord = require('../models/attendance.model');

// POST /api/subjects (Create new subject)
router.post('/', auth, async (req, res) => {
    try {
        const newSubject = new Subject({ ...req.body, user_id: req.user.id });
        await newSubject.save();
        res.status(201).json(newSubject);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

// PUT /api/subjects/:id (Update a subject)
router.put('/:id', auth, async (req, res) => {
    try {
        const subject = await Subject.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        res.json(subject);
    } catch (error) { res.status(400).json({ message: error.message }); }
});


// DELETE /api/subjects/:id (Delete subject and all related data)
router.delete('/:id', auth, async (req, res) => {
    try {
        const subjectId = req.params.id;
        const subject = await Subject.findOne({ _id: subjectId, user_id: req.user.id });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        // Cascading delete
        await Promise.all([
            AttendanceRecord.deleteMany({ subject_id: subjectId }),
            Test.deleteMany({ subject_id: subjectId }),
            Assignment.deleteMany({ subject_id: subjectId }),
        ]);
        
        await Subject.findByIdAndDelete(subjectId);
        res.json({ message: 'Subject and related data deleted.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;