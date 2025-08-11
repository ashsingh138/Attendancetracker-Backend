const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignment_name: { type: String, required: true },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Completed', 'Cancelled'], default: 'Pending' },
}, { timestamps: true });

AssignmentSchema.index({ subject_id: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);