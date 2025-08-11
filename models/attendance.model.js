const mongoose = require('mongoose');

const AttendanceRecordSchema = new mongoose.Schema({
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Store as "YYYY-MM-DD"
    duration: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['not_taken', 'present', 'absent', 'no_class'], default: 'not_taken' },
    personal_status: { type: String, enum: ['present', 'absent', null], default: null },
    reason: { type: String, default: null }, // Reason for "no_class"
}, { timestamps: true });

// Compound index to prevent duplicate records for the same class on the same day
AttendanceRecordSchema.index({ user_id: 1, subject_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', AttendanceRecordSchema);