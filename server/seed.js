const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedData = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Clear existing data
  await User.deleteMany();
  
  // Create sample users
  const users = await User.create([
    {
      name: 'Admin User',
      email: 'admin@foodapp.com',
      password: 'password123',
      role: 'admin'
    },
    {
      name: 'John Customer',
      email: 'customer@foodapp.com', 
      password: 'password123',
      role: 'customer'
    },
    {
      name: 'Jollibee Restaurant',
      email: 'jollibee@foodapp.com',
      password: 'password123',
      role: 'restaurant',
      restaurantName: 'Jollibee',
      isApproved: true
    }
  ]);
  
  console.log('✅ Sample data added!');
  console.log('Admin: admin@foodapp.com / password123');
  console.log('Customer: customer@foodapp.com / password123'); 
  console.log('Restaurant: jollibee@foodapp.com / password123');
  
  mongoose.connection.close();
};

seedData();       