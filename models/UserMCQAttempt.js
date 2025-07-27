const mongoose = require('mongoose');

const userMCQAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  mcq: {
    type: mongoose.Schema.ObjectId,
    ref: 'MCQ',
    required: true
  },
  selectedAnswer: {
    type: Number,
    required: true,
    min: 0
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  mockTest: {
    type: mongoose.Schema.ObjectId,
    ref: 'MockTest',
    default: null
  },
  attemptType: {
    type: String,
    enum: ['practice', 'mock_test'],
    default: 'practice'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attempts in same mock test
userMCQAttemptSchema.index({ user: 1, mcq: 1, mockTest: 1 }, { unique: true });

// Index for better query performance
userMCQAttemptSchema.index({ user: 1, attemptType: 1 });
userMCQAttemptSchema.index({ user: 1, isCorrect: 1 });

module.exports = mongoose.model('UserMCQAttempt', userMCQAttemptSchema);