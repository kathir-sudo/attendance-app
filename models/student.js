// models/student.js
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    rollNumber: { // NEW FIELD
        type: String,
        required: true,
        unique: true, // Ensures no two students have the same roll number
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Student', StudentSchema);