const express = require('express');
const { body } = require('express-validator');
const {
  getMockTests,
  getMockTest,
  createMockTest,
  updateMockTest,
  deleteMockTest,
  startMockTest,
  submitMockTest,
  getMockTestResults,
  getLeaderboard
} = require('../controllers/mockTest');

const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createMockTestValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Mock test title is required'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('At least one question is required')
];

const submitMockTestValidation = [
  body('answers')
    .isArray()
    .withMessage('Answers must be an array'),
  body('answers.*.mcq')
    .notEmpty()
    .withMessage('MCQ ID is required for each answer'),
  body('answers.*.selectedAnswer')
    .isInt({ min: 0 })
    .withMessage('Selected answer must be a valid option index')
];

// Routes
router.route('/')
  .get(optionalAuth, getMockTests)
  .post(protect, createMockTestValidation, createMockTest);

router.route('/:id')
  .get(optionalAuth, getMockTest)
  .put(protect, updateMockTest)
  .delete(protect, deleteMockTest);

router.post('/:id/start', protect, startMockTest);
router.post('/:id/submit', protect, submitMockTestValidation, submitMockTest);
router.get('/:id/results', protect, getMockTestResults);
router.get('/:id/leaderboard', getLeaderboard);

module.exports = router;
