const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required' 
            });
        }
        
        // Get user from database
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        // Check if user exists
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }
        
        const user = users[0];
        
        // Check if account is active
        if (!user.is_active) {
            return res.status(403).json({ 
                success: false,
                message: 'Account is deactivated. Please contact support.' 
            });
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }
        
        // Return user data (without sensitive info)
        res.json({
            success: true,
            message: 'Login successful!',
            user: {
                user_id: user.user_id,
                email: user.email,
                user_type: user.user_type,
                first_name: user.first_name,
                last_name: user.last_name,
                is_verified: user.is_verified
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during login',
            error: error.message 
        });
    }
});

// POST /api/auth/register - create new student or teacher account
router.post('/register', async (req, res) => {
    try {
        const { 
            email, 
            password, 
            firstName, 
            lastName, 
            userType,
            gradeLevel, 
            phone, 
            specialization, 
            qualifications, 
            experienceYears 
        } = req.body;

        // Validation
        if (!email || !password || !firstName || !lastName || !userType) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must be at least 6 characters long' 
            });
        }

        // Check if email already exists
        const [existingUsers] = await db.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already registered. Please login or use a different email.' 
            });
        }

        // Hash password (bcrypt cost factor 12)
        const passwordHash = await bcrypt.hash(password, 12);

        let result;
        
        // Insert based on user type
        if (userType === 'student') {
            // Validate grade level
            if (!gradeLevel || gradeLevel < 1 || gradeLevel > 10) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid grade level. Must be between 1 and 10.' 
                });
            }

            [result] = await db.query(
                `INSERT INTO users 
                (email, password_hash, first_name, last_name, user_type, grade_level)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [email, passwordHash, firstName, lastName, 'student', parseInt(gradeLevel)]
            );
        } else if (userType === 'teacher') {
            [result] = await db.query(
                `INSERT INTO users 
                (email, password_hash, first_name, last_name, user_type, phone, specialization, qualifications, experience_years)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    email, 
                    passwordHash, 
                    firstName, 
                    lastName, 
                    'teacher', 
                    phone || null, 
                    specialization || null, 
                    qualifications || null, 
                    experienceYears ? parseInt(experienceYears) : null
                ]
            );
        } else {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid user type. Must be "student" or "teacher".' 
            });
        }

        // Get the created user (without password hash)
        const [users] = await db.query(
            'SELECT user_id, email, user_type, first_name, last_name, grade_level, created_at FROM users WHERE user_id = ?',
            [result.insertId]
        );

        res.status(201).json({ 
            success: true,
            message: 'Account created successfully! Please login to continue.',
            user: users[0] 
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Registration failed. Please try again.',
            error: error.message 
        });
    }
});

// POST /api/auth/logout - front-end clears storage; we just acknowledge
router.post('/logout', (req, res) => {
    res.json({ 
        success: true,
        message: 'Logged out successfully' 
    });
});

// GET /api/auth/user/:id - get one user by id (for dashboard/profile)
router.get('/user/:id', async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT user_id, email, user_type, first_name, last_name, grade_level, phone, specialization, qualifications, experience_years, created_at FROM users WHERE user_id = ?',
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
            message: 'Failed to fetch user data' 
        });
    }
});
module.exports = router;