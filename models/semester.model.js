const mongoose = require('mongoose');

const SemesterSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    year: { type: String, required: true },
    start_date: { type: String, required: true }, // Store as YYYY-MM-DD string
    end_date: { type: String, required: true },   // Store as YYYY-MM-DD string
    is_archived: { type: Boolean, default: false },
}, { timestamps: true });

// Indexing for faster queries
SemesterSchema.index({ user_id: 1, is_archived: 1 });

module.exports = mongoose.model('Semester', SemesterSchema);