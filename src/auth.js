const express = require('express');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const db = require('./database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.id;
    req.username = decoded.username;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check user role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const rolesArray = Array.isArray(roles) ? roles : [roles];
    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Register route
router.post('/register', (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Validation
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check if user exists
  db.getUserByUsername(username, (err, user) => {
    if (user) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    db.getUserByEmail(email, (err, user) => {
      if (user) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Hash password
      bcryptjs.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: 'Error hashing password' });
        }

        // Create user
        db.createUser(username, email, hashedPassword, (err, userId) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Generate token with role
          const token = jwt.sign(
            { id: userId, username: username, role: 'teacher' },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.status(201).json({
            message: 'User registered successfully',
            token: token,
            userId: userId,
            username: username,
            role: 'teacher'
          });
        });
      });
    });
  });
});

// Login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Get user by username
  db.getUserByUsername(username, (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare password
    bcryptjs.compare(password, user.password, (err, isPasswordValid) => {
      if (err || !isPasswordValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Generate token with role
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role || 'teacher' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token: token,
        userId: user.id,
        username: user.username,
        role: user.role || 'teacher'
      });
    });
  });
});

// Get current user
router.get('/me', verifyToken, (req, res) => {
  db.getUserById(req.userId, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Logout route (client-side handles token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Forgot password route
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  db.getUserByEmail(email, (err, user) => {
    if (!user) {
      // For security, don't reveal if email exists
      return res.json({ message: 'If email exists, reset link will be sent' });
    }

    // Generate reset token (valid for 1 hour)
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    db.updatePasswordReset(email, resetToken, resetTokenExpiry, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error generating reset token' });
      }

      // In production, send email with reset link
      // For now, return the token (only for demo purposes)
      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
      
      res.json({
        message: 'Reset link generated',
        resetLink: resetLink, // Remove in production
        note: 'In production, this would be sent via email'
      });
    });
  });
});

// Reset password route
router.post('/reset-password', (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Verify reset token
  db.getUserByResetToken(token, (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    bcryptjs.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: 'Error hashing password' });
      }

      // Update password
      db.updatePassword(user.id, hashedPassword, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error updating password' });
        }

        res.json({ message: 'Password reset successfully' });
      });
    });
  });
});

module.exports = {
  router,
  verifyToken,
  requireRole
};
