const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'book_interactions.json');

// Ensure data directory and file exist
function ensureDataFile() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ interactions: {}, answers: {} }, null, 2));
}

function readData() {
    ensureDataFile();
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/book/interactions?book=grade1&page=1 - get all interactions for one page
router.get('/interactions', (req, res) => {
    try {
        const { book, page } = req.query;
        if (!book || !page) return res.status(400).json({ success: false, message: 'book and page are required' });

        const data = readData();
        const key = `${book}_page${page}`;
        const interactions = data.interactions[key] || [];

        res.json({ success: true, interactions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/book/interactions - save a new interaction (e.g. teacher adds question)
router.post('/interactions', (req, res) => {
    try {
        const { book, page, interaction } = req.body;
        if (!book || !page || !interaction) return res.status(400).json({ success: false, message: 'book, page, and interaction are required' });

        const data = readData();
        const key = `${book}_page${page}`;
        if (!data.interactions[key]) data.interactions[key] = [];

        const newInteraction = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            ...interaction
        };

        data.interactions[key].push(newInteraction);
        writeData(data);

        res.json({ success: true, interaction: newInteraction });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/book/interactions/:id - update an interaction
router.put('/interactions/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { book, page, updates } = req.body;

        const data = readData();
        const key = `${book}_page${page}`;
        if (!data.interactions[key]) return res.status(404).json({ success: false, message: 'Page not found' });

        const idx = data.interactions[key].findIndex(i => i.id === id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Interaction not found' });

        data.interactions[key][idx] = { ...data.interactions[key][idx], ...updates, id, updatedAt: new Date().toISOString() };
        writeData(data);

        res.json({ success: true, interaction: data.interactions[key][idx] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE an interaction
// DELETE /api/book/interactions/:id?book=grade1&page=1
router.delete('/interactions/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { book, page } = req.query;

        const data = readData();
        const key = `${book}_page${page}`;
        if (!data.interactions[key]) return res.status(404).json({ success: false, message: 'Page not found' });

        data.interactions[key] = data.interactions[key].filter(i => i.id !== id);
        writeData(data);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST save student answer
// POST /api/book/answers
router.post('/answers', (req, res) => {
    try {
        const { studentId, interactionId, answer, book, page } = req.body;
        if (!studentId || !interactionId) return res.status(400).json({ success: false, message: 'studentId and interactionId are required' });

        const data = readData();
        if (!data.answers[studentId]) data.answers[studentId] = {};

        const key = `${book}_page${page}_${interactionId}`;
        data.answers[studentId][key] = {
            answer,
            savedAt: new Date().toISOString(),
            book,
            page,
            interactionId
        };

        writeData(data);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET student answers for a page
// GET /api/book/answers?studentId=123&book=grade1&page=1
router.get('/answers', (req, res) => {
    try {
        const { studentId, book, page } = req.query;
        if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required' });

        const data = readData();
        const studentAnswers = data.answers[studentId] || {};

        // Filter answers for this specific page
        const pageAnswers = {};
        const prefix = `${book}_page${page}_`;
        Object.entries(studentAnswers).forEach(([key, val]) => {
            if (key.startsWith(prefix)) {
                const interactionId = key.replace(prefix, '');
                pageAnswers[interactionId] = val;
            }
        });

        res.json({ success: true, answers: pageAnswers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all data (for teacher dashboard)
// GET /api/book/all
router.get('/all', (req, res) => {
    try {
        const data = readData();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
//Export Statement.
module.exports = router;