const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    test_name: { type: String, required: true },
    test_datetime: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Completed', 'Cancelled'], default: 'Pending' },
}, { timestamps: true });

TestSchema.index({ subject_id: 1 });

module.exports = mongoose.model('Test', TestSchema);