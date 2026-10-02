const mongoose = require('mongoose');

class DatabaseManager {
  constructor() {
    this.connections = new Map();
    this.mainConnection = null;
  }

  // Connect to main database (billingmaindb) for authentication and subscription data
  async connectToMainDB() {
    if (this.mainConnection) {
      return this.mainConnection;
    }

    try {
      const mainDbUri = `${process.env.DB_CLUSTER_BASE}/${process.env.MAIN_DB_NAME}?retryWrites=true&w=majority`;
      this.mainConnection = await mongoose.createConnection(mainDbUri);
      
      this.mainConnection.on('connected', () => {
        console.log('Connected to main database (billingmaindb)');
      });

      this.mainConnection.on('error', (err) => {
        console.error('Main database connection error:', err);
      });

      return this.mainConnection;
    } catch (error) {
      console.error('Failed to connect to main database:', error);
      throw error;
    }
  }

  // Get or create connection to customer-specific database
  async getCustomerConnection(customerId) {
    if (this.connections.has(customerId)) {
      return this.connections.get(customerId);
    }

    try {
      const customerDbName = `customer_${customerId}`;
      const customerDbUri = `${process.env.DB_CLUSTER_BASE}/${customerDbName}?retryWrites=true&w=majority`;
      
      const connection = await mongoose.createConnection(customerDbUri);
      
      connection.on('connected', () => {
        console.log(`Connected to customer database: ${customerDbName}`);
      });

      connection.on('error', (err) => {
        console.error(`Customer database connection error for ${customerDbName}:`, err);
      });

      this.connections.set(customerId, connection);
      return connection;
    } catch (error) {
      console.error(`Failed to connect to customer database for ${customerId}:`, error);
      throw error;
    }
  }

  // Create new customer database (called during subscription activation)
  async createCustomerDatabase(customerId) {
    try {
      const connection = await this.getCustomerConnection(customerId);
      
      // Create a test collection to ensure database is created
      const testCollection = connection.collection('_database_info');
      await testCollection.insertOne({
        customerId,
        createdAt: new Date(),
        status: 'active'
      });

      console.log(`Customer database created successfully for: customer_${customerId}`);
      return connection;
    } catch (error) {
      console.error(`Failed to create customer database for ${customerId}:`, error);
      throw error;
    }
  }

  // Close specific customer connection
  async closeCustomerConnection(customerId) {
    if (this.connections.has(customerId)) {
      const connection = this.connections.get(customerId);
      await connection.close();
      this.connections.delete(customerId);
      console.log(`Closed connection for customer: ${customerId}`);
    }
  }

  // Close all connections
  async closeAllConnections() {
    // Close customer connections
    for (const [customerId, connection] of this.connections) {
      await connection.close();
      console.log(`Closed connection for customer: ${customerId}`);
    }
    this.connections.clear();

    // Close main connection
    if (this.mainConnection) {
      await this.mainConnection.close();
      this.mainConnection = null;
      console.log('Closed main database connection');
    }
  }

  // Get connection count for monitoring
  getConnectionCount() {
    return {
      customerConnections: this.connections.size,
      hasMainConnection: !!this.mainConnection
    };
  }
}

// Export singleton instance
module.exports = new DatabaseManager();