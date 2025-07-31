// models/attendance.js
const mongoose = require('mongoose');

const AttendanceRecordSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    records: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true
        },
        rollNumber: String, // NEW: Storing roll number for easier display
        studentName: String,
        status: {
            type: String,
            enum: ['Present', 'Absent'],
            required: true
        }
    }]
});

module.exports = mongoose.model('AttendanceRecord', AttendanceRecordSchema);