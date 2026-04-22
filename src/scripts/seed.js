/**
 * Seeder script — creates an admin user for initial setup
 * Run: node src/scripts/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const connectDB = require('../config/database');

const seed = async () => {
  await connectDB();

  const existing = await User.findOne({ email: 'admin@taskflow.com' });
  if (existing) {
    console.log('✅ Admin already exists:', existing.email);
    process.exit(0);
  }

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@taskflow.com',
    password: 'Admin@12345',
    role: 'admin',
  });

  console.log('✅ Admin user created:');
  console.log('   Email   :', admin.email);
  console.log('   Password: Admin@12345');
  console.log('   Role    :', admin.role);
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
