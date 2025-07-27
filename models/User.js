const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  subscriptionType: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  subscriptionExpiresAt: {
    type: Date,
    default: null
  },
  profileData: {
    phone: String,
    college: String,
    yearOfStudy: String,
    targetExam: {
      type: String,
      enum: ['NEET SS', 'INI SS', 'MCH', 'Other']
    },
    avatar: String
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
  const crypto = require('crypto');
  
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Check if user has premium subscription
userSchema.methods.hasPremiumAccess = function() {
  if (this.subscriptionType === 'premium') {
    if (!this.subscriptionExpiresAt || this.subscriptionExpiresAt > new Date()) {
      return true;
    }
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);