const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  getUserDashboard,
  getUserProgress,
  getUserAttempts,
  getUserMockTestHistory
} = require('../controllers/user');

const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/profile')
  .get(getUserProfile)
  .put(updateUserProfile);

router.get('/dashboard', getUserDashboard);
router.get('/progress', getUserProgress);
router.get('/attempts', getUserAttempts);
router.get('/mock-test-history', getUserMockTestHistory);

module.exports = router;