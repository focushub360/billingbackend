const express = require('express')
const router = express.Router()
const { protect, adminOnly } = require('../middleware/authMiddleware')
const { registerAdmin, login, forgotPassword, verifyOtp, resetPassword, changePassword, updateProfile } = require('../controllers/authController')
const customerAuthService = require('../services/customerAuthService')
const customerAuth = require('../middleware/customerAuth')

// Allow first admin registration, then protect subsequent registrations
router.post('/register', async (req, res, next) => {
  try {
    const User = require('../models/User')
    const adminCount = await User.countDocuments({ role: 'admin' })
    
    if (adminCount === 0) {
      // First admin can register without authentication
      return registerAdmin(req, res)
    } else {
      // Subsequent registrations require admin authentication
      return protect(req, res, () => {
        return adminOnly(req, res, () => {
          return registerAdmin(req, res)
        })
      })
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error' })
  }
})
// Customer login (using subscriber ID and password)
router.post('/customer-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const result = await customerAuthService.authenticateCustomer(username, password);
    
    res.json({
      success: true,
      message: 'Login successful',
      token: result.token,
      customer: result.customer
    });

  } catch (error) {
    console.error('Customer login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed'
    });
  }
});

// Verify customer token
router.get('/verify-customer', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const result = await customerAuthService.verifyCustomerToken(token);
    
    res.json({
      success: true,
      customer: result.customer
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Token verification failed'
    });
  }
});

// Change customer password
router.put('/customer-change-password', customerAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const result = await customerAuthService.changeCustomerPassword(
      req.customer.id,
      currentPassword,
      newPassword
    );
    
    res.json(result);

  } catch (error) {
    console.error('Password change error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Password change failed'
    });
  }
});

// Original admin routes
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword)
router.put('/change-password', protect, changePassword)
router.put('/profile', protect, updateProfile)

module.exports = router