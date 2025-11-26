const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'], 
    minlength: 6 
  },
  phone: { 
    type: String, 
    required: [true, 'Phone is required'], 
    trim: true 
  },
  address: { 
    type: String, 
    required: [true, 'Address is required'], 
    trim: true 
  },
  role: {
    type: String,
    enum: ['customer', 'restaurant', 'rider', 'admin'],
    default: 'customer'
  },
  
  // RIDER SPECIFIC FIELDS
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  vehicleType: {
    type: String,
    enum: ['motorcycle', 'bicycle', 'car', 'scooter', ''],
    default: ''
  },
  licensePlate: {
    type: String,
    trim: true,
    default: ''
  },
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
  lastLocationUpdate: {
    type: Date
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  // RESTAURANT SPECIFIC FIELDS
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  
  // APPROVAL SYSTEM
  isApproved: {
    type: Boolean,
    default: function () {
      // Auto-approve customer & admin only
      return this.role === 'customer' || this.role === 'admin';
    }
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function() {
      if (this.role === 'customer' || this.role === 'admin') return 'approved';
      return 'pending';
    }
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  
  // ACCOUNT STATUS
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // TIMESTAMPS
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // PROFILE FIELDS
  profileImage: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: ''
  }
}, {
  timestamps: true
});

/* ---------- MIDDLEWARE ---------- */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate average rating when ratings change
  if (this.isModified('rating') || this.isModified('totalRatings')) {
    this.averageRating = this.totalRatings > 0 ? (this.rating / this.totalRatings) : 0;
  }
  
  // Auto-set approval status based on role
  if (this.isModified('role')) {
    if (this.role === 'customer' || this.role === 'admin') {
      this.isApproved = true;
      this.approvalStatus = 'approved';
    } else {
      this.isApproved = false;
      this.approvalStatus = 'pending';
    }
  }
  
  next();
});

/* ---------- INDEXES ---------- */
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ location: '2dsphere' });
userSchema.index({ approvalStatus: 1 });
userSchema.index({ createdAt: -1 });

/* ---------- VIRTUAL FIELDS ---------- */
userSchema.virtual('formattedRating').get(function() {
  return this.averageRating.toFixed(1);
});

userSchema.virtual('isOnline').get(function() {
  return this.status === 'online';
});

userSchema.virtual('isRider').get(function() {
  return this.role === 'rider';
});

userSchema.virtual('isRestaurant').get(function() {
  return this.role === 'restaurant';
});

userSchema.virtual('isCustomer').get(function() {
  return this.role === 'customer';
});

userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

userSchema.virtual('canAcceptOrders').get(function() {
  return this.role === 'rider' && this.status === 'online' && this.isApproved && this.isActive;
});

/* ---------- INSTANCE METHODS ---------- */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateRating = async function(newRating) {
  if (newRating < 0 || newRating > 5) {
    throw new Error('Rating must be between 0 and 5');
  }
  
  this.rating += newRating;
  this.totalRatings += 1;
  this.averageRating = this.rating / this.totalRatings;
  
  return this.save();
};

userSchema.methods.goOnline = async function() {
  if (this.role !== 'rider') {
    throw new Error('Only riders can go online');
  }
  
  this.status = 'online';
  this.lastActive = new Date();
  return this.save();
};

userSchema.methods.goOffline = async function() {
  if (this.role !== 'rider') {
    throw new Error('Only riders can go offline');
  }
  
  this.status = 'offline';
  this.lastActive = new Date();
  return this.save();
};

userSchema.methods.updateLocation = async function(latitude, longitude) {
  this.location = {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
  this.lastLocationUpdate = new Date();
  return this.save();
};

userSchema.methods.incrementDeliveries = async function() {
  if (this.role !== 'rider') {
    throw new Error('Only riders can increment deliveries');
  }
  
  this.totalDeliveries += 1;
  return this.save();
};

userSchema.methods.approveAccount = async function() {
  this.isApproved = true;
  this.approvalStatus = 'approved';
  this.rejectionReason = '';
  return this.save();
};

userSchema.methods.rejectAccount = async function(reason = '') {
  this.isApproved = false;
  this.approvalStatus = 'rejected';
  this.rejectionReason = reason;
  return this.save();
};

/* ---------- STATIC METHODS ---------- */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

userSchema.statics.findActiveRiders = function() {
  return this.find({ 
    role: 'rider', 
    status: 'online',
    isApproved: true,
    isActive: true 
  });
};

userSchema.statics.findNearbyRiders = function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    role: 'rider',
    status: 'online',
    isApproved: true,
    isActive: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // meters
      }
    }
  });
};

userSchema.statics.findPendingApprovals = function() {
  return this.find({
    approvalStatus: 'pending',
    role: { $in: ['rider', 'restaurant'] }
  });
};

userSchema.statics.getRiderStats = async function() {
  const stats = await this.aggregate([
    {
      $match: {
        role: 'rider'
      }
    },
    {
      $group: {
        _id: null,
        totalRiders: { $sum: 1 },
        onlineRiders: {
          $sum: {
            $cond: [{ $eq: ['$status', 'online'] }, 1, 0]
          }
        },
        approvedRiders: {
          $sum: {
            $cond: [{ $eq: ['$isApproved', true] }, 1, 0]
          }
        },
        averageRating: { $avg: '$averageRating' },
        totalDeliveries: { $sum: '$totalDeliveries' }
      }
    }
  ]);
  
  return stats[0] || {
    totalRiders: 0,
    onlineRiders: 0,
    approvedRiders: 0,
    averageRating: 0,
    totalDeliveries: 0
  };
};

/* ---------- JSON TRANSFORM ---------- */
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  
  // Remove sensitive information
  delete user.password;
  delete user.__v;
  
  return user;
};

/* ---------- QUERY HELPERS ---------- */
userSchema.query.byRole = function(role) {
  return this.where({ role });
};

userSchema.query.active = function() {
  return this.where({ isActive: true });
};

userSchema.query.approved = function() {
  return this.where({ isApproved: true });
};

userSchema.query.online = function() {
  return this.where({ status: 'online' });
};

module.exports = mongoose.model('User', userSchema);