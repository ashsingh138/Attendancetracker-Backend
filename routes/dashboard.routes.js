const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Semester = require('../models/semester.model');
const Subject = require('../models/subject.model');
const Test = require('../models/test.model');
const Assignment = require('../models/assignment.model');
const AttendanceRecord = require('../models/attendance.model');

// GET /api/dashboard
router.get('/', auth, async (req, res) => {
    try {
        // Find the user's active (not archived) semester
        const activeSemester = await Semester.findOne({ user_id: req.user.id, is_archived: false });

        if (!activeSemester) {
            // Return a specific structure if no semester is active
            return res.json({
                activeSemester: null,
                subjects: [],
                tests: [],
                assignments: [],
                attendanceRecords: [],
            });
        }

        const subjects = await Subject.find({ semester_id: activeSemester._id });
        const subjectIds = subjects.map(s => s._id);

        // Fetch all related data for the active subjects in parallel
        const [tests, assignments, attendanceRecords] = await Promise.all([
            Test.find({ subject_id: { $in: subjectIds } }).populate('subject_id', 'subject_code subject_name').lean(),
            Assignment.find({ subject_id: { $in: subjectIds } }).populate('subject_id', 'subject_code subject_name').lean(),
            AttendanceRecord.find({ subject_id: { $in: subjectIds } }).lean()
        ]);
        
        // Rename 'subject_id' to 'subjects' to match frontend expectations from Supabase joins
        const formattedTests = tests.map(t => ({...t, subjects: t.subject_id, subject_id: t.subject_id._id }));
        const formattedAssignments = assignments.map(a => ({...a, subjects: a.subject_id, subject_id: a.subject_id._id }));

        res.json({
            activeSemester,
            subjects,
            tests: formattedTests,
            assignments: formattedAssignments,
            attendanceRecords,
        });

    } catch (error) {
        console.error("Dashboard data fetch error:", error);
        res.status(500).json({ message: "Server error fetching dashboard data." });
    }
});


// --- ADDED THIS NEW ROUTE ---
// GET /api/dashboard/semester/:semesterId
// Fetches all dashboard data for a SPECIFIC semester (used for archives)
router.get('/semester/:semesterId', auth, async (req, res) => {
    try {
        const { semesterId } = req.params;

        // 1. Verify this semester exists and belongs to the user
        const semester = await Semester.findOne({ 
            _id: semesterId, 
            user_id: req.user.id 
        });

        if (!semester) {
            return res.status(404).json({ message: "Semester not found or does not belong to user." });
        }

        // 2. Fetch all data related to this semester ID
        const subjects = await Subject.find({ semester_id: semester._id });
        const subjectIds = subjects.map(s => s._id);

        const [tests, assignments, attendanceRecords] = await Promise.all([
            Test.find({ subject_id: { $in: subjectIds } }).populate('subject_id', 'subject_code subject_name').lean(),
            Assignment.find({ subject_id: { $in: subjectIds } }).populate('subject_id', 'subject_code subject_name').lean(),
            AttendanceRecord.find({ subject_id: { $in: subjectIds } }).lean()
        ]);
        
        // 3. Format data just like you do in the main dashboard route
        const formattedTests = tests.map(t => ({...t, subjects: t.subject_id, subject_id: t.subject_id._id }));
        const formattedAssignments = assignments.map(a => ({...a, subjects: a.subject_id, subject_id: a.subject_id._id }));

        // 4. Send all data back
        res.json({
            activeSemester: semester, // Send the requested semester as 'activeSemester'
            subjects,
            tests: formattedTests,
            assignments: formattedAssignments,
            attendanceRecords,
        });

    } catch (error) {
        console.error("Archived semester data fetch error:", error);
        res.status(500).json({ message: "Server error fetching semester data." });
    }
});
// --- END OF NEW ROUTE ---


module.exports = router;