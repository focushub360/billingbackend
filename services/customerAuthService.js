const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dbManager = require('../config/dbManager');

class CustomerAuthService {
  // Authenticate customer and return JWT token with customer database info
  async authenticateCustomer(username, password) {
    try {
      // Connect to main database to get subscription info
      const mainConnection = await dbManager.connectToMainDB();
      
      // Get subscription model from main database
      const Subscription = mainConnection.model('Subscription', require('../models/SubscriptionSchema'));
      
      // Find active subscription by subscriber ID (username)
      const subscription = await Subscription.findOne({
        subscriberId: username,
        status: 'active',
        isActive: true,
        endDate: { $gt: new Date() }
      });

      if (!subscription) {
        throw new Error('Invalid credentials or subscription expired');
      }

      // Verify password (default is 'welcome123' but can be changed)
      const isValidPassword = await bcrypt.compare(password, subscription.subscriberPassword || await bcrypt.hash('welcome123', 12));
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Get customer database connection
      const customerConnection = await dbManager.getCustomerConnection(subscription.subscriberId);
      
      // Generate JWT token with customer info
      const token = jwt.sign(
        {
          customerId: subscription.subscriberId,
          subscriberId: subscription.subscriberId,
          userId: subscription.userId,
          email: subscription.email,
          planName: subscription.planName,
          endDate: subscription.endDate
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        success: true,
        token,
        customer: {
          id: subscription.subscriberId,
          email: subscription.email,
          planName: subscription.planName,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          databaseName: `customer_${subscription.subscriberId}`
        }
      };

    } catch (error) {
      console.error('Customer authentication error:', error);
      throw error;
    }
  }

  // Verify customer token and get customer info
  async verifyCustomerToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if subscription is still active
      const mainConnection = await dbManager.connectToMainDB();
      const Subscription = mainConnection.model('Subscription', require('../models/SubscriptionSchema'));
      
      const subscription = await Subscription.findOne({
        subscriberId: decoded.customerId,
        status: 'active',
        isActive: true,
        endDate: { $gt: new Date() }
      });

      if (!subscription) {
        throw new Error('Subscription expired or inactive');
      }

      return {
        success: true,
        customer: decoded
      };

    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }

  // Change customer password
  async changeCustomerPassword(customerId, currentPassword, newPassword) {
    try {
      const mainConnection = await dbManager.connectToMainDB();
      const Subscription = mainConnection.model('Subscription', require('../models/SubscriptionSchema'));
      
      const subscription = await Subscription.findOne({
        subscriberId: customerId,
        status: 'active',
        isActive: true
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Verify current password
      const currentHashedPassword = subscription.subscriberPassword || await bcrypt.hash('welcome123', 12);
      const isValidPassword = await bcrypt.compare(currentPassword, currentHashedPassword);
      
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      
      // Update password
      subscription.subscriberPassword = hashedNewPassword;
      await subscription.save();

      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }
}

module.exports = new CustomerAuthService();