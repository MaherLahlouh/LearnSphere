/*
# .env.example - Copy this to .env and fill in your values
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=learning_platform
DB_CONNECTION_LIMIT=10
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci

*/
// the above info should be moved to .env file before deployment.
//MySQL connection setup
const mysql = require('mysql2/promise');

// Database connection configuration for XAMPP
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',              // XAMPP default username
  password: '',              // XAMPP default password (empty)
  database: 'learning_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci'
});

// Test connection on startup
db.getConnection()
  .then(conn => {
    console.log('✅ Connected to learning_platform database!');
    console.log('✅ Database: learning_platform');
    console.log('✅ Host: localhost');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed!');
    console.error('Error:', err.message);
    console.error('Please check:');
    console.error('  1. XAMPP MySQL is running');
    console.error('  2. Database "learning_platform" exists');
    console.error('  3. Username/password are correct');
    process.exit(1);
  });

module.exports = db;

/*After Moving the important and secret things of the database into the .env file this how the code should be

require('dotenv').config(); // Load environment variables

const mysql = require('mysql2/promise');

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease create a .env file with all required variables.');
  process.exit(1);
}

// Create database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci'
});

// Test connection on startup
db.getConnection()
  .then(conn => {
    console.log('✅ Connected to database!');
    console.log(`✅ Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    console.log(`✅ Database: ${process.env.DB_NAME}`);
    console.log(`✅ User: ${process.env.DB_USER}`);
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed!');
    console.error('Error:', err.message);
    console.error('\nPlease check:');
    console.error('  1. XAMPP MySQL is running');
    console.error('  2. Database exists in MySQL');
    console.error('  3. .env file has correct credentials');
    console.error('  4. Username/password are correct');
    process.exit(1);
  });

module.exports = db;  

*/ 