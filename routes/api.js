// routes/api.js
const express = require('express');
const router = express.Router();

const Student = require('../models/student');
const AttendanceRecord = require('../models/attendance');

// --- Student Routes ---

// GET all students (Sorted by roll number)
router.get('/students', async (req, res) => {
    try {
        const students = await Student.find().sort({ rollNumber: 1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new student (Updated to include rollNumber)
router.post('/students', async (req, res) => {
    const student = new Student({
        name: req.body.name,
        rollNumber: req.body.rollNumber
    });
    try {
        const newStudent = await student.save();
        res.status(201).json(newStudent);
    } catch (err) {
        // Handle duplicate roll number error
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Error: Roll Number already exists.' });
        }
        res.status(400).json({ message: err.message });
    }
});

// NEW: DELETE a student
router.delete('/students/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        await student.deleteOne();
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Attendance Routes ---

// POST a new attendance record (Updated to include rollNumber)
router.post('/attendance', async (req, res) => {
    const { groupName, records } = req.body;
    const attendanceRecord = new AttendanceRecord({ groupName, records });
    try {
        const newRecord = await attendanceRecord.save();
        res.status(201).json(newRecord);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET all attendance records
router.get('/attendance', async (req, res) => {
    try {
        const records = await AttendanceRecord.find().sort({ date: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET a single attendance record by ID
router.get('/attendance/:id', async (req, res) => {
    try {
        const record = await AttendanceRecord.findById(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });
        res.json(record);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// NEW: PUT (update) an existing attendance record
router.put('/attendance/:id', async (req, res) => {
    try {
        const { groupName, records } = req.body;
        const updatedRecord = await AttendanceRecord.findByIdAndUpdate(
            req.params.id,
            { groupName, records, date: new Date() }, // update date on edit
            { new: true, runValidators: true } // options
        );
        if (!updatedRecord) return res.status(404).json({ message: 'Record not found' });
        res.json(updatedRecord);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// NEW: DELETE an attendance record


// routes/api.js
// ... (keep all existing code)

// --- Student Routes ---

// ... (GET /students and POST /students are still here)

// NEW: POST multiple students (Bulk Add)
router.post('/students/bulk', async (req, res) => {
    const studentsData = req.body.students; // Expect an array of students

    if (!Array.isArray(studentsData) || studentsData.length === 0) {
        return res.status(400).json({ message: 'Student data must be a non-empty array.' });
    }

    try {
        // ordered: false allows the operation to continue even if some inserts fail (e.g., duplicate roll numbers)
        const result = await Student.insertMany(studentsData, { ordered: false });
        res.status(201).json({ message: `${result.length} students added successfully.` });
    } catch (err) {
        // err.writeErrors contains details about which documents failed
        const successfulCount = err.result.nInserted;
        const failedCount = err.writeErrors.length;
        const errorDetails = err.writeErrors.map(e => `Roll No ${e.op.rollNumber}: ${e.errmsg}`).join('\n');
        
        res.status(207).json({ // 207 Multi-Status
            message: `Completed with some errors. Added: ${successfulCount}, Failed: ${failedCount}.`,
            errors: errorDetails
        });
    }
});

// NEW: PUT (update) a student
router.put('/students/:id', async (req, res) => {
    try {
        const { name, rollNumber } = req.body;
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            { name, rollNumber },
            { new: true, runValidators: true }
        );
        if (!updatedStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(updatedStudent);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Error: Roll Number already exists.' });
        }
        res.status(400).json({ message: err.message });
    }
});

router.delete('/attendance/:id', async (req, res) => {
    try {
        const record = await AttendanceRecord.findById(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });
        await record.deleteOne();
        res.json({ message: 'Attendance record deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ... (DELETE /students and all Attendance routes are still here)

module.exports = router;