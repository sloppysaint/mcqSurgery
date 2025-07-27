const mongoose = require('mongoose');

const mcqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true
  },
  options: {
    type: [String],
    required: [true, 'Options are required'],
    validate: {
      validator: function(v) {
        return v && v.length >= 2 && v.length <= 6;
      },
      message: 'MCQ must have between 2 and 6 options'
    }
  },
  correctAnswer: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: 0,
    validate: {
      validator: function(v) {
        return v < this.options.length;
      },
      message: 'Correct answer index must be valid'
    }
  },
  explanation: {
    type: String,
    required: [true, 'Explanation is required'],
    trim: true
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    enum: [
      'General Surgery',
      'GI Surgery',
      'Urology',
      'Pediatric Surgery',
      'Cardiothoracic Surgery',
      'Neurosurgery',
      'Orthopedics',
      'Plastic Surgery',
      'Vascular Surgery',
      'Trauma Surgery',
      'Oncology',
      'Endocrine Surgery',
      'Hepatobiliary Surgery',
      'Transplant Surgery',
      'Emergency Surgery',
      'Surgical Anatomy',
      'Surgical Pathology',
      'Surgical Physiology',
      'Pre and Post Operative Care',
      'Surgical Instruments',
      'Anesthesia',
      'Other'
    ]
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: ['Basic', 'Intermediate', 'Advanced']
  },
  references: [{
    book: String,
    chapter: String,
    page: String
  }],
  tags: [String],
  isPremium: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  statistics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    correctAttempts: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
mcqSchema.index({ topic: 1, difficulty: 1 });
mcqSchema.index({ isPremium: 1 });
mcqSchema.index({ tags: 1 });

// Virtual for success rate
mcqSchema.virtual('successRate').get(function() {
  if (this.statistics.totalAttempts === 0) return 0;
  return (this.statistics.correctAttempts / this.statistics.totalAttempts) * 100;
});

// Method to update statistics
mcqSchema.methods.updateStatistics = function(isCorrect, timeSpent) {
  this.statistics.totalAttempts += 1;
  if (isCorrect) {
    this.statistics.correctAttempts += 1;
  }
  
  // Update average time
  const currentAvg = this.statistics.averageTime;
  const totalAttempts = this.statistics.totalAttempts;
  this.statistics.averageTime = ((currentAvg * (totalAttempts - 1)) + timeSpent) / totalAttempts;
  
  return this.save();
};

module.exports = mongoose.model('MCQ', mcqSchema);