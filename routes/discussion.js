const express = require('express');
const { body } = require('express-validator');
const {
  getDiscussions,
  getDiscussion,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  addReply,
  likeDiscussion,
  unlikeDiscussion,
  getGroupLinks
} = require('../controllers/discussion');

const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createDiscussionValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  body('category')
    .optional()
    .isIn(['doubt', 'general', 'study_material', 'exam_strategy', 'other'])
    .withMessage('Invalid category')
];

const addReplyValidation = [
  body('content')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Reply content must be at least 5 characters long')
];

// Routes
router.route('/')
  .get(optionalAuth, getDiscussions)
  .post(protect, createDiscussionValidation, createDiscussion);

router.get('/groups', getGroupLinks);

router.route('/:id')
  .get(optionalAuth, getDiscussion)
  .put(protect, updateDiscussion)
  .delete(protect, deleteDiscussion);

router.post('/:id/reply', protect, addReplyValidation, addReply);
router.post('/:id/like', protect, likeDiscussion);
router.delete('/:id/like', protect, unlikeDiscussion);

module.exports = router;