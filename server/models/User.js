const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'] },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: [true, 'Password is required'], minlength: 6 },
  phone: { type: String, required: [true, 'Phone is required'], trim: true },
  address: { type: String, required: [true, 'Address is required'], trim: true },
  role: {
    type: String,
    enum: ['customer', 'restaurant', 'rider', 'admin'],
    default: 'customer'
  },
  isApproved: {
    type: Boolean,
    default: function () {
      /* auto-approve customer & admin only */
      return this.role === 'customer' || this.role === 'admin';
    }
  },
  isActive: { type: Boolean, default: true },
  vehicleType: {
    type: String,
    enum: ['motorcycle', 'bicycle', 'car', ''],
    default: ''
  },
  licenseNumber: { type: String, default: '', trim: true },
  createdAt: { type: Date, default: Date.now }
});

/* ---------- hooks ---------- */
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

/* ---------- instance methods ---------- */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ---------- static helpers ---------- */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

module.exports = mongoose.model('User', userSchema);