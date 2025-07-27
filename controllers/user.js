const User = require('../models/User');
const UserMCQAttempt = require('../models/UserMCQAttempt');
const UserMockTestAttempt = require('../models/UserMockTestAttempt');
const Bookmark = require('../models/Bookmark');
const MCQ = require('../models/MCQ');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      profileData: req.body.profileData
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user dashboard data
// @route   GET /api/user/dashboard
// @access  Private
exports.getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get total MCQs attempted
    const totalAttempted = await UserMCQAttempt.countDocuments({
      user: userId,
      attemptType: 'practice'
    });

    // Get correct answers
    const correctAnswers = await UserMCQAttempt.countDocuments({
      user: userId,
      attemptType: 'practice',
      isCorrect: true
    });

    // Get total bookmarks
    const totalBookmarks = await Bookmark.countDocuments({ user: userId });

    // Get mock tests attempted
    const mockTestsAttempted = await UserMockTestAttempt.countDocuments({
      user: userId
    });

    // Get recent mock test scores
    const recentMockTests = await UserMockTestAttempt.find({ user: userId })
      .populate('mockTest', 'title')
      .sort('-completedAt')
      .limit(5)
      .select('score completedAt mockTest');

    // Calculate accuracy
    const accuracy = totalAttempted > 0 ? (correctAnswers / totalAttempted) * 100 : 0;

    // Get topic-wise performance
    const topicPerformance = await UserMCQAttempt.aggregate([
      {
        $match: {
          user: userId,
          attemptType: 'practice'
        }
      },
      {
        $lookup: {
          from: 'mcqs',
          localField: 'mcq',
          foreignField: '_id',
          as: 'mcqData'
        }
      },
      {
        $unwind: '$mcqData'
      },
      {
        $group: {
          _id: '$mcqData.topic',
          total: { $sum: 1 },
          correct: {
            $sum: {
              $cond: ['$isCorrect', 1, 0]
            }
          }
        }
      },
      {
        $project: {
          topic: '$_id',
          total: 1,
          correct: 1,
          accuracy: {
            $multiply: [
              { $divide: ['$correct', '$total'] },
              100
            ]
          }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalAttempted,
          correctAnswers,
          accuracy: Math.round(accuracy * 100) / 100,
          totalBookmarks,
          mockTestsAttempted
        },
        recentMockTests,
        topicPerformance
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user progress
// @route   GET /api/user/progress
// @access  Private
exports.getUserProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { timeframe = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // Get daily progress
    const dailyProgress = await UserMCQAttempt.aggregate([
      {
        $match: {
          user: userId,
          attemptType: 'practice',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          total: { $sum: 1 },
          correct: {
            $sum: {
              $cond: ['$isCorrect', 1, 0]
            }
          }
        }
      },
      {
        $project: {
          date: '$_id',
          total: 1,
          correct: 1,
          accuracy: {
            $multiply: [
              { $divide: ['$correct', '$total'] },
              100
            ]
          }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    // Get weekly mock test performance
    const weeklyMockTests = await UserMockTestAttempt.aggregate([
      {
        $match: {
          user: userId,
          completedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%U',
              date: '$completedAt'
            }
          },
          averageScore: { $avg: '$score' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        dailyProgress,
        weeklyMockTests
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user MCQ attempts
// @route   GET /api/user/attempts
// @access  Private
exports.getUserAttempts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;

    const attempts = await UserMCQAttempt.find({
      user: req.user.id,
      attemptType: 'practice'
    })
      .populate('mcq', 'question topic difficulty')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    const total = await UserMCQAttempt.countDocuments({
      user: req.user.id,
      attemptType: 'practice'
    });

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
      count: attempts.length,
      pagination,
      data: {
        attempts
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user mock test history
// @route   GET /api/user/mock-test-history
// @access  Private
exports.getUserMockTestHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const mockTestHistory = await UserMockTestAttempt.find({
      user: req.user.id
    })
      .populate('mockTest', 'title category totalQuestions')
      .sort('-completedAt')
      .skip(startIndex)
      .limit(limit);

    const total = await UserMockTestAttempt.countDocuments({
      user: req.user.id
    });

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
      count: mockTestHistory.length,
      pagination,
      data: {
        mockTestHistory
      }
    });
  } catch (err) {
    next(err);
  }
};