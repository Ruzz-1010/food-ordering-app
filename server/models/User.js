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
    unique: true,
    lowercase: true,
    trim: true
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
    default: function() {
      // ✅ AUTO-APPROVE CUSTOMERS, REQUIRE APPROVAL FOR RESTAURANT/RIDER
      return this.role === 'customer' || this.role === 'admin';
    }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  // Rider-specific fields
  vehicleType: { 
    type: String, 
    enum: ['motorcycle', 'bicycle', 'car'],
    default: 'motorcycle' 
  },
  licenseNumber: { 
    type: String, 
    default: '' 
  },
  // Location for delivery calculations
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add index for location-based queries
userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
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

// Virtual for formatted user info
userSchema.virtual('userInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isApproved: this.isApproved,
    phone: this.phone,
    address: this.address
  };
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);