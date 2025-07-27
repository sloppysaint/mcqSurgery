const mongoose = require('mongoose');

const mockTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Mock test title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  questions: [{
    type: mongoose.Schema.ObjectId,
    ref: 'MCQ',
    required: true
  }],
  totalQuestions: {
    type: Number,
    required: true
  },
  passingScore: {
    type: Number,
    default: 60,
    min: 0,
    max: 100
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  category: {
    type: String,
    enum: ['NEET SS', 'INI SS', 'MCH', 'Topic Wise', 'Mixed'],
    default: 'Mixed'
  },
  topics: [String],
  difficulty: {
    type: String,
    enum: ['Basic', 'Intermediate', 'Advanced', 'Mixed'],
    default: 'Mixed'
  },
  instructions: [String],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  statistics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    highestScore: {
      type: Number,
      default: 0
    },
    lowestScore: {
      type: Number,
      default: 100
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
mockTestSchema.index({ category: 1, isPremium: 1 });
mockTestSchema.index({ scheduledAt: 1 });
mockTestSchema.index({ isActive: 1 });

// Pre-save middleware to set totalQuestions
mockTestSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalQuestions = this.questions.length;
  }
  next();
});

// Method to update statistics
mockTestSchema.methods.updateStatistics = function(score) {
  this.statistics.totalAttempts += 1;
  
  // Update average score
  const currentAvg = this.statistics.averageScore;
  const totalAttempts = this.statistics.totalAttempts;
  this.statistics.averageScore = ((currentAvg * (totalAttempts - 1)) + score) / totalAttempts;
  
  // Update highest and lowest scores
  if (score > this.statistics.highestScore) {
    this.statistics.highestScore = score;
  }
  if (score < this.statistics.lowestScore) {
    this.statistics.lowestScore = score;
  }
  
  return this.save();
};

module.exports = mongoose.model('MockTest', mockTestSchema);