const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AttendanceRecord = require('../models/attendance.model');

// POST /api/attendance/upsert (Upsert a single attendance record)
router.post('/upsert', auth, async (req, res) => {
    const { subject_id, date, duration, ...updates } = req.body;
    try {
        const record = await AttendanceRecord.findOneAndUpdate(
            { user_id: req.user.id, subject_id, date },
            { $set: { ...updates, user_id: req.user.id, subject_id, date, duration } },
            { new: true, upsert: true, runValidators: true }
        );
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/attendance/bulk (Bulk update records for a day)
router.post('/bulk', auth, async (req, res) => {
    const { records } = req.body; // Expects an array of records
    const bulkOps = records.map(record => ({
        updateOne: {
            filter: { user_id: req.user.id, subject_id: record.subject_id, date: record.date },
            update: { $set: { ...record, user_id: req.user.id } },
            upsert: true
        }
    }));
    try {
        await AttendanceRecord.bulkWrite(bulkOps);
        // Refetch the updated records to send back to the client
        const dates = [...new Set(records.map(r => r.date))];
        const subject_ids = [...new Set(records.map(r => r.subject_id))];
        const updatedRecords = await AttendanceRecord.find({ user_id: req.user.id, date: {$in: dates}, subject_id: {$in: subject_ids} });
        res.json(updatedRecords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;