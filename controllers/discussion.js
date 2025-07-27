const { validationResult } = require('express-validator');
const Discussion = require('../models/Discussion');

// WhatsApp/Telegram group links
const GROUP_LINKS = {
  whatsapp: {
    general: 'https://chat.whatsapp.com/general-surgery-group',
    neetss: 'https://chat.whatsapp.com/neet-ss-surgery-group',
    iniss: 'https://chat.whatsapp.com/ini-ss-surgery-group'
  },
  telegram: {
    general: 'https://t.me/mcqsurgery_general',
    neetss: 'https://t.me/mcqsurgery_neetss',
    iniss: 'https://t.me/mcqsurgery_iniss'
  }
};

// @desc    Get all discussions
// @route   GET /api/discussion
// @access  Public/Private
exports.getDiscussions = async (req, res, next) => {
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
    let query = Discussion.find(JSON.parse(queryStr));

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
      query = query.sort('-isPinned -createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Discussion.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Populate user info
    query = query.populate('user', 'name profileData.college');

    // Executing query
    const discussions = await query;

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
      count: discussions.length,
      pagination,
      data: {
        discussions
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single discussion
// @route   GET /api/discussion/:id
// @access  Public/Private
exports.getDiscussion = async (req, res, next) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('user', 'name profileData.college')
      .populate('replies.user', 'name profileData.college')
      .populate('relatedMCQ', 'question topic');

    if (!discussion) {
      return res.status(404).json({
        status: 'error',
        message: 'Discussion not found'
      });
    }

    // Increment views
    discussion.views += 1;
    await discussion.save();

    res.status(200).json({
      status: 'success',
      data: {
        discussion
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new discussion
// @route   POST /api/discussion
// @access  Private
exports.createDiscussion = async (req, res, next) => {
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
    req.body.user = req.user.id;

    const discussion = await Discussion.create(req.body);

    // Populate user info
    await discussion.populate('user', 'name profileData.college');

    res.status(201).json({
      status: 'success',
      data: {
        discussion
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update discussion
// @route   PUT /api/discussion/:id
// @access  Private
exports.updateDiscussion = async (req, res, next) => {
  try {
    let discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        status: 'error',
        message: 'Discussion not found'
      });
    }

    // Make sure user is discussion owner
    if (discussion.user.toString() !== req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to update this discussion'
      });
    }

    discussion = await Discussion.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('user', 'name profileData.college');

    res.status(200).json({
      status: 'success',
      data: {
        discussion
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete discussion
// @route   DELETE /api/discussion/:id
// @access  Private
exports.deleteDiscussion = async (req, res, next) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        status: 'error',
        message: 'Discussion not found'
      });
    }

    // Make sure user is discussion owner
    if (discussion.user.toString() !== req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to delete this discussion'
      });
    }

    await discussion.remove();

    res.status(200).json({
      status: 'success',
      message: 'Discussion deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add reply to discussion
// @route   POST /api/discussion/:id/reply
// @access  Private
exports.addReply = async (req, res, next) => {
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

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        status: 'error',
        message: 'Discussion not found'
      });
    }

    const newReply = {
      user: req.user.id,
      content: req.body.content,
      isExpertReply: req.body.isExpertReply || false
    };

    discussion.replies.push(newReply);
    await discussion.save();

    // Populate the new reply
    await discussion.populate('replies.user', 'name profileData.college');

    const addedReply = discussion.replies[discussion.replies.length - 1];

    res.status(201).json({
      status: 'success',
      data: {
        reply: addedReply
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Like discussion
// @route   POST /api/discussion/:id/like
// @access  Private
exports.likeDiscussion = async (req, res, next) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        status: 'error',
        message: 'Discussion not found'
      });
    }

    // Check if already liked
    if (discussion.likes.includes(req.user.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Discussion already liked'
      });
    }

    discussion.likes.push(req.user.id);
    await discussion.save();

    res.status(200).json({
      status: 'success',
      message: 'Discussion liked successfully',
      data: {
        likeCount: discussion.likes.length
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unlike discussion
// @route   DELETE /api/discussion/:id/like
// @access  Private
exports.unlikeDiscussion = async (req, res, next) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        status: 'error',
        message: 'Discussion not found'
      });
    }

    // Check if not liked
    if (!discussion.likes.includes(req.user.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Discussion not liked yet'
      });
    }

    discussion.likes = discussion.likes.filter(
      like => like.toString() !== req.user.id
    );
    await discussion.save();

    res.status(200).json({
      status: 'success',
      message: 'Discussion unliked successfully',
      data: {
        likeCount: discussion.likes.length
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get group links
// @route   GET /api/discussion/groups
// @access  Public
exports.getGroupLinks = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        groups: GROUP_LINKS
      }
    });
  } catch (err) {
    next(err);
  }
};
