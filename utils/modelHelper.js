const mongoose = require('mongoose');

// Helper function to get model from customer-specific database connection
const getCustomerModel = (connection, modelName, schema) => {
  try {
    // Check if model already exists in this connection
    if (connection.models[modelName]) {
      return connection.models[modelName];
    }
    
    // Create and return new model
    return connection.model(modelName, schema);
  } catch (error) {
    console.error(`Error getting model ${modelName}:`, error);
    throw error;
  }
};

// Helper function to get all models for a customer database
const getCustomerModels = (connection) => {
  const models = {};
  
  // Import all schemas
  const schemas = {
    User: require('../models/User').schema,
    Item: require('../models/Item').schema,
    Customer: require('../models/Customer').schema,
    Loan: require('../models/Loan').schema,
    Transaction: require('../models/Transaction').schema,
    Repayment: require('../models/Repayment').schema,
    Invoice: require('../models/Invoice').schema,
    Expense: require('../models/Expense').schema,
    ShopDetails: require('../models/ShopDetails').schema,
    // Add other models as needed
  };
  
  // Create models for the customer database
  Object.keys(schemas).forEach(modelName => {
    try {
      models[modelName] = getCustomerModel(connection, modelName, schemas[modelName]);
    } catch (error) {
      console.error(`Failed to create model ${modelName}:`, error);
    }
  });
  
  return models;
};

// Middleware to attach customer models to request
const attachCustomerModels = (req, res, next) => {
  if (req.customer && req.customer.connection) {
    req.models = getCustomerModels(req.customer.connection);
  }
  next();
};

module.exports = {
  getCustomerModel,
  getCustomerModels,
  attachCustomerModels
};