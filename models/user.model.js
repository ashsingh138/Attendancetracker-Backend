const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    // Profile fields
    full_name: { type: String, default: '' },
    college_name: { type: String, default: '' },
    department: { type: String, default: '' },
    phone: { type: String, default: '' },
    dob: { type: Date, default: null },
    place: { type: String, default: '' },
    year_of_study: { type: String, default: '' },
    avatar_url: { type: String, default: '' },
    
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);