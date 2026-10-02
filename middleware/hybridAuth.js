const jwt = require('jsonwebtoken');
const dbManager = require('../config/dbManager');
const customerAuthService = require('../services/customerAuthService');

// Middleware that handles both customer authentication and regular user authentication
const hybridAuth = async (req, res, next) => {
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
    
    // Check if this is a customer token (has customerId or subscriberId)
    if (decoded.customerId || decoded.subscriberId) {
      // Handle customer authentication
      const customerId = decoded.customerId || decoded.subscriberId;
      
      // Verify customer subscription is still active
      try {
        await customerAuthService.verifyCustomerToken(token);
        
        // Get customer-specific database connection
        const customerConnection = await dbManager.getCustomerConnection(customerId);
        
        // Attach customer info and database connection to request
        req.customer = {
          id: customerId,
          userId: decoded.userId,
          email: decoded.email,
          connection: customerConnection,
          type: 'customer'
        };
        
        // For backward compatibility, also set req.user
        req.user = {
          id: decoded.userId,
          customerId: customerId,
          email: decoded.email,
          role: 'customer'
        };
        
      } catch (error) {
        return res.status(401).json({ 
          success: false, 
          message: 'Customer subscription expired or invalid.' 
        });
      }
      
    } else {
      // Handle regular user authentication (admin/staff within customer database)
      // This would be for users created within a customer's database
      req.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        role: decoded.role || 'user',
        type: 'user'
      };
      
      // If there's a customerId in the token, get the customer connection
      if (decoded.customerId) {
        const customerConnection = await dbManager.getCustomerConnection(decoded.customerId);
        req.customer = {
          id: decoded.customerId,
          connection: customerConnection
        };
      }
    }

    next();
  } catch (error) {
    console.error('Hybrid authentication error:', error);
    
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

module.exports = hybridAuth;