const mongoose = require('mongoose');

const userMockTestAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  mockTest: {
    type: mongoose.Schema.ObjectId,
    ref: 'MockTest',
    required: true
  },
  answers: [{
    mcq: {
      type: mongoose.Schema.ObjectId,
      ref: 'MCQ',
      required: true
    },
    selectedAnswer: {
      type: Number,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    }
  }],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  wrongAnswers: {
    type: Number,
    required: true
  },
  unanswered: {
    type: Number,
    default: 0
  },
  totalTimeSpent: {
    type: Number, // in seconds
    required: true
  },
  startedAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: true
  },
  rank: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
userMockTestAttemptSchema.index({ user: 1, mockTest: 1 });
userMockTestAttemptSchema.index({ user: 1, score: -1 });
userMockTestAttemptSchema.index({ mockTest: 1, score: -1 });

// Method to calculate rank
userMockTestAttemptSchema.methods.calculateRank = async function() {
  const higherScores = await this.constructor.countDocuments({
    mockTest: this.mockTest,
    score: { $gt: this.score }
  });
  
  this.rank = higherScores + 1;
  return this.save();
};

module.exports = mongoose.model('UserMockTestAttempt', userMockTestAttemptSchema);