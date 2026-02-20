const express = require('express');
const router = express.Router();

// Get all teachers
// GET /api/teachers
router.get('/', (req, res) => {
    res.json([
        { id: 1, name: 'Mr. Ahmed', subject: 'Math' },
        { id: 2, name: 'Ms. Layla', subject: 'Science' }
    ]);
});

// POST /api/teachers - add a new teacher (logs and returns body for now)
router.post('/', (req, res) => {
    const newTeacher = req.body;
    console.log('Adding new teacher:', newTeacher);
    res.json({ message: 'Teacher added successfully', data: newTeacher });
});

module.exports = router;