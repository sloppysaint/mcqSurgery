const { validationResult } = require('express-validator');
const MockTest = require('../models/MockTest');
const UserMockTestAttempt = require('../models/UserMockTestAttempt');
const UserMCQAttempt = require('../models/UserMCQAttempt');
const MCQ = require('../models/MCQ');

// @desc    Get all mock tests
// @route   GET /api/mock-tests
// @access  Public/Private
exports.getMockTests = async (req, res, next) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    let query = MockTest.find(JSON.parse(queryStr));

    // Filter premium content based on user subscription
    if (!req.user || !req.user.hasPremiumAccess()) {
      query = query.find({ isPremium: false });
    }

    // Only show active mock tests
    query = query.find({ isActive: true });

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    } else {
      // Default fields to exclude questions for list view
      query = query.select('-questions');
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await MockTest.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const mockTests = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      status: 'success',
      count: mockTests.length,
      pagination,
      data: {
        mockTests
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single mock test
// @route   GET /api/mock-tests/:id
// @access  Public/Private
exports.getMockTest = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);

    if (!mockTest) {
      return res.status(404).json({
        status: 'error',
        message: 'Mock test not found'
      });
    }

    // Check if user has access to premium content
    if (mockTest.isPremium && (!req.user || !req.user.hasPremiumAccess())) {
      return res.status(403).json({
        status: 'error',
        message: 'Premium subscription required to access this mock test',
        code: 'PREMIUM_REQUIRED'
      });
    }

    // Get user's previous attempts if logged in
    let userAttempts = [];
    if (req.user) {
      userAttempts = await UserMockTestAttempt.find({
        user: req.user._id,
        mockTest: req.params.id
      }).sort('-completedAt');
    }

    res.status(200).json({
      status: 'success',
      data: {
        mockTest,
        userAttempts
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new mock test
// @route   POST /api/mock-tests
// @access  Private (Admin only)
exports.createMockTest = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Add user to req.body
    req.body.createdBy = req.user.id;

    const mockTest = await MockTest.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        mockTest
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update mock test
// @route   PUT /api/mock-tests/:id
// @access  Private (Admin only)
exports.updateMockTest = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!mockTest) {
      return res.status(404).json({
        status: 'error',
        message: 'Mock test not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        mockTest
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete mock test
// @route   DELETE /api/mock-tests/:id
// @access  Private (Admin only)
exports.deleteMockTest = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id);

    if (!mockTest) {
      return res.status(404).json({
        status: 'error',
        message: 'Mock test not found'
      });
    }

    await mockTest.remove();

    res.status(200).json({
      status: 'success',
      message: 'Mock test deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Start mock test
// @route   POST /api/mock-tests/:id/start
// @access  Private
exports.startMockTest = async (req, res, next) => {
  try {
    const mockTest = await MockTest.findById(req.params.id).populate('questions');

    if (!mockTest) {
      return res.status(404).json({
        status: 'error',
        message: 'Mock test not found'
      });
    }

    // Check if user has access to premium content
    if (mockTest.isPremium && !req.user.hasPremiumAccess()) {
      return res.status(403).json({
        status: 'error',
        message: 'Premium subscription required to access this mock test',
        code: 'PREMIUM_REQUIRED'
      });
    }

    // Filter out premium MCQs if user doesn't have premium access
    let questions = mockTest.questions;
    if (!req.user.hasPremiumAccess()) {
      questions = questions.filter(mcq => !mcq.isPremium);
    }

    // Return questions without correct answers and explanations
    const questionsForTest = questions.map(mcq => ({
      _id: mcq._id,
      question: mcq.question,
      options: mcq.options,
      topic: mcq.topic,
      difficulty: mcq.difficulty
    }));

    res.status(200).json({
      status: 'success',
      data: {
        mockTest: {
          _id: mockTest._id,
          title: mockTest.title,
          description: mockTest.description,
          duration: mockTest.duration,
          totalQuestions: questionsForTest.length,
          instructions: mockTest.instructions
        },
        questions: questionsForTest,
        startTime: new Date()
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit mock test
// @route   POST /api/mock-tests/:id/submit
// @access  Private
exports.submitMockTest = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const mockTest = await MockTest.findById(req.params.id).populate('questions');

    if (!mockTest) {
      return res.status(404).json({
        status: 'error',
        message: 'Mock test not found'
      });
    }

    const { answers, startTime, endTime } = req.body;
    const startedAt = new Date(startTime);
    const completedAt = new Date(endTime || Date.now());
    const totalTimeSpent = Math.floor((completedAt - startedAt) / 1000); // in seconds

    // Process answers and calculate score
    let correctAnswers = 0;
    let wrongAnswers = 0;
    const processedAnswers = [];

    for (const answer of answers) {
      const mcq = mockTest.questions.find(q => q._id.toString() === answer.mcq);
      if (mcq) {
        const isCorrect = answer.selectedAnswer === mcq.correctAnswer;
        if (isCorrect) {
          correctAnswers++;
        } else {
          wrongAnswers++;
        }

        processedAnswers.push({
          mcq: mcq._id,
          selectedAnswer: answer.selectedAnswer,
          isCorrect,
          timeSpent: answer.timeSpent || 0
        });

        // Create individual MCQ attempt record
        await UserMCQAttempt.create({
          user: req.user._id,
          mcq: mcq._id,
          selectedAnswer: answer.selectedAnswer,
          isCorrect,
          timeSpent: answer.timeSpent || 0,
          mockTest: mockTest._id,
          attemptType: 'mock_test'
        });

        // Update MCQ statistics
        await mcq.updateStatistics(isCorrect, answer.timeSpent || 0);
      }
    }

    const totalQuestions = mockTest.totalQuestions;
    const unanswered = totalQuestions - answers.length;
    const score = (correctAnswers / totalQuestions) * 100;

    // Create mock test attempt record
    const mockTestAttempt = await UserMockTestAttempt.create({
      user: req.user._id,
      mockTest: mockTest._id,
      answers: processedAnswers,
      score: Math.round(score * 100) / 100,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      unanswered,
      totalTimeSpent,
      startedAt,
      completedAt
    });

    // Calculate rank
    await mockTestAttempt.calculateRank();

    // Update mock test statistics
    await mockTest.updateStatistics(score);

    res.status(200).json({
      status: 'success',
      data: {
        attemptId: mockTestAttempt._id,
        score: mockTestAttempt.score,
        rank: mockTestAttempt.rank,
        correctAnswers,
        wrongAnswers,
        unanswered,
        totalTimeSpent
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get mock test results
// @route   GET /api/mock-tests/:id/results
// @access  Private
exports.getMockTestResults = async (req, res, next) => {
  try {
    const { attemptId } = req.query;

    if (!attemptId) {
      return res.status(400).json({
        status: 'error',
        message: 'Attempt ID is required'
      });
    }

    const attempt = await UserMockTestAttempt.findOne({
      _id: attemptId,
      user: req.user._id
    }).populate({
      path: 'mockTest',
      select: 'title description totalQuestions'
    }).populate({
      path: 'answers.mcq',
      select: 'question options correctAnswer explanation references topic difficulty'
    });

    if (!attempt) {
      return res.status(404).json({
        status: 'error',
        message: 'Mock test attempt not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        attempt
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get mock test leaderboard
// @route   GET /api/mock-tests/:id/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const leaderboard = await UserMockTestAttempt.find({
      mockTest: req.params.id
    })
      .populate('user', 'name profileData.college')
      .sort('-score -completedAt')
      .limit(limit)
      .select('user score completedAt rank');

    res.status(200).json({
      status: 'success',
      count: leaderboard.length,
      data: {
        leaderboard
      }
    });
  } catch (err) {
    next(err);
  }
};