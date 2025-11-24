const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'] 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true 
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'] 
  },
  phone: { 
    type: String, 
    required: [true, 'Phone is required'] 
  },
  address: { 
    type: String, 
    required: [true, 'Address is required'] 
  },
  role: { 
    type: String, 
    enum: ['customer', 'restaurant', 'rider', 'admin'], 
    default: 'customer' 
  },
  isApproved: { 
    type: Boolean, 
    default: true  // AUTO-APPROVE EVERYONE FOR NOW
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  vehicleType: { 
    type: String, 
    default: 'motorcycle' 
  },
  licenseNumber: { 
    type: String, 
    default: '' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);