const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Semester = require('../models/semester.model');

// Upsert a semester (Create or Update)
router.post('/', auth, async (req, res) => {
    const { id, name, year, start_date, end_date } = req.body;
    const payload = { user_id: req.user.id, name, year, start_date, end_date, is_archived: false };
    try {
        // Ensure no other active semester exists for this user before creating a new one
        if (!id) {
             await Semester.updateMany({ user_id: req.user.id }, { is_archived: true });
        }
       
        const semester = id
            ? await Semester.findOneAndUpdate({ _id: id, user_id: req.user.id }, payload, { new: true })
            : await Semester.create(payload);
            
        res.status(201).json(semester);
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
});

// --- ADDED THIS NEW ROUTE ---
// GET /api/semesters/archived
// Fetches all archived semesters for the logged-in user
router.get('/archived', auth, async (req, res) => {
    try {
        const archivedSemesters = await Semester.find({ 
            user_id: req.user.id, 
            is_archived: true 
        }).sort({ start_date: -1 }); // Sort by start date, newest first

        res.json(archivedSemesters);
    } catch (error) {
        console.error("Error fetching archived semesters:", error);
        res.status(500).json({ message: error.message });
    }
});
// --- END OF NEW ROUTE ---

// Archive a semester
router.put('/:id/archive', auth, async (req, res) => {
    try {
        const semester = await Semester.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id }, 
            { is_archived: true }
        );
        if (!semester) return res.status(404).json({ message: 'Semester not found' });
        res.json({ message: 'Semester archived successfully' });
    } catch (error) { 
        res.status(500).json({ message: error.message }); 
    }
});

module.exports = router;