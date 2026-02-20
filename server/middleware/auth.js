//JWT token verification middleware
const jwt = require('jsonwebtoken');

// i need to replace this JWT_SECRET=ACCESS_TOKEN_SECRET, this is the actual name of it ACCESS_TOKEN_SECRET in .env(file).
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token, access denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, userType } available in routes
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = auth;