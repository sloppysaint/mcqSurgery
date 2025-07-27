const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
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
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate bookmarks
bookmarkSchema.index({ user: 1, mcq: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
