const express = require('express');
const {
  getSubscriptionPlans,
  getSubscriptionStatus,
  createSubscription,
  cancelSubscription,
  renewSubscription
} = require('../controllers/subscription');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/plans', getSubscriptionPlans);

// Protected routes
router.use(protect);

router.get('/status', getSubscriptionStatus);
router.post('/subscribe', createSubscription);
router.post('/cancel', cancelSubscription);
router.post('/renew', renewSubscription);

module.exports = router;