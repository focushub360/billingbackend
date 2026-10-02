const jwt = require('jsonwebtoken');
const dbManager = require('../config/dbManager');

// Middleware to authenticate customer and set up their database connection
const customerAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get customer ID from token
    const customerId = decoded.customerId || decoded.subscriberId;
    
    if (!customerId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Customer ID not found.' 
      });
    }

    // Get customer-specific database connection
    const customerConnection = await dbManager.getCustomerConnection(customerId);
    
    // Attach customer info and database connection to request
    req.customer = {
      id: customerId,
      userId: decoded.userId,
      email: decoded.email,
      connection: customerConnection
    };

    next();
  } catch (error) {
    console.error('Customer authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired.' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed.' 
    });
  }
};

module.exports = customerAuth;