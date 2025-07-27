const express = require('express');
const { body, query } = require('express-validator');
const {
  getMCQs,
  getMCQ,
  createMCQ,
  updateMCQ,
  deleteMCQ,
  submitAnswer,
  bookmarkMCQ,
  removeBookmark,
  getBookmarkedMCQs,
  getRandomMCQs
} = require('../controllers/mcq');

const { protect, optionalAuth, requirePremium } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createMCQValidation = [
  body('question')
    .trim()
    .notEmpty()
    .withMessage('Question is required'),
  body('options')
    .isArray({ min: 2, max: 6 })
    .withMessage('MCQ must have between 2 and 6 options'),
  body('correctAnswer')
    .isInt({ min: 0 })
    .withMessage('Correct answer must be a valid option index'),
  body('explanation')
    .trim()
    .notEmpty()
    .withMessage('Explanation is required'),
  body('topic')
    .notEmpty()
    .withMessage('Topic is required'),
  body('difficulty')
    .isIn(['Basic', 'Intermediate', 'Advanced'])
    .withMessage('Difficulty must be Basic, Intermediate, or Advanced')
];

const submitAnswerValidation = [
  body('selectedAnswer')
    .isInt({ min: 0 })
    .withMessage('Selected answer must be a valid option index'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a positive number')
];

// Routes
router.route('/')
  .get(optionalAuth, getMCQs)
  .post(protect, createMCQValidation, createMCQ);

router.get('/random', optionalAuth, getRandomMCQs);
router.get('/bookmarked', protect, getBookmarkedMCQs);

router.route('/:id')
  .get(optionalAuth, getMCQ)
  .put(protect, updateMCQ)
  .delete(protect, deleteMCQ);

router.post('/:id/submit', protect, submitAnswerValidation, submitAnswer);
router.post('/:id/bookmark', protect, bookmarkMCQ);
router.delete('/:id/bookmark', protect, removeBookmark);

module.exports = router;