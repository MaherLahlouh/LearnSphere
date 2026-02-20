const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all users
// GET /api/users
router.get('/', async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT user_id, email, first_name, last_name, user_type, grade_level, created_at FROM users ORDER BY created_at DESC'
        );
        
        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch users' 
        });
    }
});

// GET /api/users/email/:email - find user by email (route must be before /:id)
router.get('/email/:email', async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT user_id, email, first_name, last_name, user_type, grade_level FROM users WHERE email = ?',
            [req.params.email]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Get user by email error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch user' 
        });
    }
});

// GET /api/users/:id - get one user by id
router.get('/:id', async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT user_id, email, first_name, last_name, user_type, grade_level, phone, specialization, qualifications, experience_years FROM users WHERE user_id = ?',
            [req.params.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        res.json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch user' 
        });
    }
});

// POST /api/users/register - teacher can create a new student account
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, userType, gradeLevel } = req.body;

        // Validation
        if (!email || !password || !firstName || !lastName || !userType) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields' 
            });
        }

        // Check if user already exists
        const [existingUsers] = await db.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'User with this email already exists' 
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.query(
            `INSERT INTO users 
            (email, password_hash, first_name, last_name, user_type, grade_level, is_active)
            VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
            [email, passwordHash, firstName, lastName, userType, gradeLevel || null]
        );

        // Get created user
        const [users] = await db.query(
            'SELECT user_id, email, first_name, last_name, user_type, grade_level FROM users WHERE user_id = ?',
            [result.insertId]
        );

        res.status(201).json({ 
            success: true,
            message: 'User registered successfully',
            user: users[0]
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to register user',
            error: error.message 
        });
    }
});

// PUT /api/users/:id - update user first_name, last_name, or email
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { first_name, last_name, email } = req.body;

    // Build dynamic update query (only update provided fields)
    const updates = [];
    const values = [];
    
    if (first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(last_name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No fields to update' 
      });
    }

    // Add user_id for WHERE clause
    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = ?`;
    
    const [result] = await db.query(query, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Fetch updated user data to return
    const [rows] = await db.query(
      'SELECT user_id, email, first_name, last_name, user_type, grade_level FROM users WHERE user_id = ?', 
      [userId]
    );
    
    res.json({ 
      success: true,
      message: 'User updated successfully', 
      user: rows[0] 
    });
    
  } catch (error) {
    console.error('❌ [UPDATE USER] Error:', error);
    
    // Handle duplicate email error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false,
        message: 'Email already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to update user',
      error: error.message 
    });
  }
});

module.exports = router;