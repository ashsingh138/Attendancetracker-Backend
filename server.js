// server/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// --- START OF NEW CORS CONFIGURATION ---
// We will get the live frontend's URL from an environment variable.
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
};
app.use(cors(corsOptions));
// --- END OF NEW CORS CONFIGURATION ---

app.use(express.json());

// Set up your routes as before
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/semesters', require('./routes/semester.routes'));
app.use('/api/subjects', require('./routes/subject.routes'));
app.use('/api/tests', require('./routes/test.routes'));
app.use('/api/assignments', require('./routes/assignment.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
// Add this line in server.js with your other routes

// Add this in server.js, after your other app.use() routes

app.get('/api/cron/keep-alive', (req, res) => {
    console.log('Keep-alive ping received.');
    res.status(200).send('Ping successful.');
});
// DB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));