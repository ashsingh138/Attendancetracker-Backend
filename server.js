require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error(err));

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/semesters', require('./routes/semester.routes'));
app.use('/api/subjects', require('./routes/subject.routes'));
app.use('/api/tests', require('./routes/test.routes'));
app.use('/api/assignments', require('./routes/assignment.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));