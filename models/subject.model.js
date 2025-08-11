const mongoose = require('mongoose');

const ScheduleSlotSchema = new mongoose.Schema({
    day: { type: String, required: true }, // e.g., "Monday"
    duration: { type: Number, required: true, min: 1 }, // in hours
}, { _id: false });

const SubjectSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    semester_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
    subject_name: { type: String, required: true },
    subject_code: { type: String, required: true },
    professor_name: { type: String, default: '' },
    attendance_goal: { type: Number, default: 75, min: 1, max: 100 },
    schedule: [ScheduleSlotSchema],
}, { timestamps: true });

SubjectSchema.index({ semester_id: 1 });

module.exports = mongoose.model('Subject', SubjectSchema);