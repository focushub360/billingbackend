const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const ShopDetails = require('./models/ShopDetails');
const Item = require('./models/Item');

async function initializeDatabase() {
  console.log('🚀 Starting Database Initialization & Admin Data Setup...\n');

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in .env file!');
    }

    console.log(`📡 Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database successfully!\n');

    // 1. Initialize Admin User
    console.log('👤 Checking Admin User status...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@focusbilling.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'System Admin';

    let adminUser = await User.findOne({ role: 'admin' });

    if (adminUser) {
      console.log(`ℹ️ Admin user already exists: ${adminUser.email}`);
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        phone: '+91 9876543210',
        department: 'Administration',
        isActive: true
      });
      console.log('✅ Admin user created successfully!');
      console.log(`   - Email: ${adminEmail}`);
      console.log(`   - Password: ${adminPassword}`);
      console.log(`   - Role: admin`);
    }

    // 2. Initialize Default Shop Details
    console.log('\n🏬 Checking Shop Details status...');
    let shop = await ShopDetails.findOne({ isActive: true });
    if (shop) {
      console.log(`ℹ️ Active shop details already exist: ${shop.shopName}`);
    } else {
      shop = await ShopDetails.create({
        shopName: 'GOLDEN JEWELLERY & PAWNBROKERS',
        address: '123 Main Street, Jewelry Market, City - 600001',
        phone: '+91 9876543210',
        email: 'contact@goldenjewellery.com',
        gstNumber: '33ABCDE1234F1Z5',
        licenseNumber: 'TN/PBN/2024/001',
        location: 'Tamil Nadu, India',
        auditorName: 'M/s Standard Financial Auditors',
        isActive: true
      });
      console.log(`✅ Default shop details created: ${shop.shopName}`);
    }

    // 3. Initialize Default Master Items
    console.log('\n💎 Checking Master Items...');
    const existingItems = await Item.countDocuments({ itemType: 'master' });
    if (existingItems > 0) {
      console.log(`ℹ️ Master items already seeded (${existingItems} items found).`);
    } else {
      const defaultItems = [
        {
          code: 'ITM-GOLD-RING',
          name: 'Gold Ring',
          categories: ['Gold', 'Jewellery'],
          carats: ['22K', '24K', '18K'],
          category: 'Gold',
          carat: '22K',
          itemType: 'master',
          status: 'available'
        },
        {
          code: 'ITM-GOLD-CHAIN',
          name: 'Gold Chain',
          categories: ['Gold', 'Jewellery'],
          carats: ['22K', '24K'],
          category: 'Gold',
          carat: '22K',
          itemType: 'master',
          status: 'available'
        },
        {
          code: 'ITM-GOLD-BANGLE',
          name: 'Gold Bangle',
          categories: ['Gold', 'Jewellery'],
          carats: ['22K', '916'],
          category: 'Gold',
          carat: '22K',
          itemType: 'master',
          status: 'available'
        },
        {
          code: 'ITM-SILVER-COIN',
          name: 'Silver Coin',
          categories: ['Silver', 'Coins'],
          carats: ['999', '925'],
          category: 'Silver',
          carat: '999',
          itemType: 'master',
          status: 'available'
        }
      ];

      await Item.insertMany(defaultItems);
      console.log(`✅ Seeded ${defaultItems.length} default master items.`);
    }

    console.log('\n🎉 Database Initialization Complete!');
    console.log('==================================================');
    console.log('🔑 ADMIN LOGIN CREDENTIALS:');
    console.log(`   Email:    ${adminUser.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('==================================================\n');

  } catch (error) {
    console.error('❌ Error during database initialization:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed.');
    process.exit(0);
  }
}

initializeDatabase();
