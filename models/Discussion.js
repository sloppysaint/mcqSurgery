const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Discussion title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Discussion content is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['doubt', 'general', 'study_material', 'exam_strategy', 'other'],
    default: 'doubt'
  },
  topic: {
    type: String,
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
  relatedMCQ: {
    type: mongoose.Schema.ObjectId,
    ref: 'MCQ',
    default: null
  },
  replies: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    isExpertReply: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isResolved: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for better query performance
discussionSchema.index({ category: 1, topic: 1 });
discussionSchema.index({ user: 1 });
discussionSchema.index({ isPinned: -1, createdAt: -1 });

// Virtual for reply count
discussionSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Virtual for like count
discussionSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

module.exports = mongoose.model('Discussion', discussionSchema);