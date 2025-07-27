const { validationResult } = require('express-validator');
const MCQ = require('../models/MCQ');
const UserMCQAttempt = require('../models/UserMCQAttempt');
const Bookmark = require('../models/Bookmark');

// @desc    Get all MCQs with filtering, sorting, and pagination
// @route   GET /api/mcqs
// @access  Public/Private
exports.getMCQs = async (req, res, next) => {
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
    let query = MCQ.find(JSON.parse(queryStr));

    // Filter premium content based on user subscription
    if (!req.user || !req.user.hasPremiumAccess()) {
      query = query.find({ isPremium: false });
    }

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
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
    const total = await MCQ.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const mcqs = await query;

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
      count: mcqs.length,
      pagination,
      data: {
        mcqs
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single MCQ
// @route   GET /api/mcqs/:id
// @access  Public/Private
exports.getMCQ = async (req, res, next) => {
  try {
    const mcq = await MCQ.findById(req.params.id);

    if (!mcq) {
      return res.status(404).json({
        status: 'error',
        message: 'MCQ not found'
      });
    }

    // Check if user has access to premium content
    if (mcq.isPremium && (!req.user || !req.user.hasPremiumAccess())) {
      return res.status(403).json({
        status: 'error',
        message: 'Premium subscription required to access this MCQ',
        code: 'PREMIUM_REQUIRED'
      });
    }

    // Get user's previous attempt if logged in
    let userAttempt = null;
    if (req.user) {
      userAttempt = await UserMCQAttempt.findOne({
        user: req.user._id,
        mcq: req.params.id,
        attemptType: 'practice'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        mcq,
        userAttempt
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new MCQ
// @route   POST /api/mcqs
// @access  Private (Admin only)
exports.createMCQ = async (req, res, next) => {
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

    const mcq = await MCQ.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        mcq
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update MCQ
// @route   PUT /api/mcqs/:id
// @access  Private (Admin only)
exports.updateMCQ = async (req, res, next) => {
  try {
    const mcq = await MCQ.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!mcq) {
      return res.status(404).json({
        status: 'error',
        message: 'MCQ not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        mcq
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete MCQ
// @route   DELETE /api/mcqs/:id
// @access  Private (Admin only)
exports.deleteMCQ = async (req, res, next) => {
  try {
    const mcq = await MCQ.findById(req.params.id);

    if (!mcq) {
      return res.status(404).json({
        status: 'error',
        message: 'MCQ not found'
      });
    }

    await mcq.remove();

    res.status(200).json({
      status: 'success',
      message: 'MCQ deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit answer for MCQ
// @route   POST /api/mcqs/:id/submit
// @access  Private
exports.submitAnswer = async (req, res, next) => {
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

    const mcq = await MCQ.findById(req.params.id);

    if (!mcq) {
      return res.status(404).json({
        status: 'error',
        message: 'MCQ not found'
      });
    }

    // Check if user has access to premium content
    if (mcq.isPremium && !req.user.hasPremiumAccess()) {
      return res.status(403).json({
        status: 'error',
        message: 'Premium subscription required to access this MCQ',
        code: 'PREMIUM_REQUIRED'
      });
    }

    const { selectedAnswer, timeSpent = 0 } = req.body;
    const isCorrect = selectedAnswer === mcq.correctAnswer;

    // Check if user has already attempted this MCQ in practice mode
    const existingAttempt = await UserMCQAttempt.findOne({
      user: req.user._id,
      mcq: req.params.id,
      attemptType: 'practice'
    });

    if (existingAttempt) {
      // Update existing attempt
      existingAttempt.selectedAnswer = selectedAnswer;
      existingAttempt.isCorrect = isCorrect;
      existingAttempt.timeSpent = timeSpent;
      await existingAttempt.save();
    } else {
      // Create new attempt
      await UserMCQAttempt.create({
        user: req.user._id,
        mcq: req.params.id,
        selectedAnswer,
        isCorrect,
        timeSpent,
        attemptType: 'practice'
      });
    }

    // Update MCQ statistics
    await mcq.updateStatistics(isCorrect, timeSpent);

    res.status(200).json({
      status: 'success',
      data: {
        isCorrect,
        correctAnswer: mcq.correctAnswer,
        explanation: mcq.explanation,
        references: mcq.references
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bookmark MCQ
// @route   POST /api/mcqs/:id/bookmark
// @access  Private
exports.bookmarkMCQ = async (req, res, next) => {
  try {
    const mcq = await MCQ.findById(req.params.id);

    if (!mcq) {
      return res.status(404).json({
        status: 'error',
        message: 'MCQ not found'
      });
    }

    // Check if already bookmarked
    const existingBookmark = await Bookmark.findOne({
      user: req.user._id,
      mcq: req.params.id
    });

    if (existingBookmark) {
      return res.status(400).json({
        status: 'error',
        message: 'MCQ already bookmarked'
      });
    }

    const bookmark = await Bookmark.create({
      user: req.user._id,
      mcq: req.params.id,
      notes: req.body.notes || ''
    });

    res.status(201).json({
      status: 'success',
      data: {
        bookmark
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove bookmark
// @route   DELETE /api/mcqs/:id/bookmark
// @access  Private
exports.removeBookmark = async (req, res, next) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({
      user: req.user._id,
      mcq: req.params.id
    });

    if (!bookmark) {
      return res.status(404).json({
        status: 'error',
        message: 'Bookmark not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Bookmark removed successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get bookmarked MCQs
// @route   GET /api/mcqs/bookmarked
// @access  Private
exports.getBookmarkedMCQs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;

    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate('mcq')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    const total = await Bookmark.countDocuments({ user: req.user._id });

    // Pagination result
    const pagination = {};
    const endIndex = page * limit;

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
      count: bookmarks.length,
      pagination,
      data: {
        bookmarks
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get random MCQs
// @route   GET /api/mcqs/random
// @access  Public/Private
exports.getRandomMCQs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const topic = req.query.topic;
    const difficulty = req.query.difficulty;

    let matchStage = { isActive: true };

    // Filter premium content based on user subscription
    if (!req.user || !req.user.hasPremiumAccess()) {
      matchStage.isPremium = false;
    }

    if (topic) {
      matchStage.topic = topic;
    }

    if (difficulty) {
      matchStage.difficulty = difficulty;
    }

    const mcqs = await MCQ.aggregate([
      { $match: matchStage },
      { $sample: { size: limit } }
    ]);

    res.status(200).json({
      status: 'success',
      count: mcqs.length,
      data: {
        mcqs
      }
    });
  } catch (err) {
    next(err);
  }
};