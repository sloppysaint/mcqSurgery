const User = require('../models/User');

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Premium',
    price: 299,
    currency: 'INR',
    duration: 30, // days
    features: [
      'Access to 9000+ Premium MCQs',
      'Unlimited Mock Tests',
      'Detailed Performance Analytics',
      'WhatsApp Group Access',
      'Expert Doubt Resolution',
      'Mobile App Access'
    ]
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Premium',
    price: 2999,
    currency: 'INR',
    duration: 365, // days
    features: [
      'Access to 9000+ Premium MCQs',
      'Unlimited Mock Tests',
      'Detailed Performance Analytics',
      'WhatsApp Group Access',
      'Expert Doubt Resolution',
      'Mobile App Access',
      'Priority Support',
      '2 Months Free (Best Value)'
    ]
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime Premium',
    price: 9999,
    currency: 'INR',
    duration: null, // lifetime
    features: [
      'Access to 9000+ Premium MCQs',
      'Unlimited Mock Tests',
      'Detailed Performance Analytics',
      'WhatsApp Group Access',
      'Expert Doubt Resolution',
      'Mobile App Access',
      'Priority Support',
      'Lifetime Updates',
      'One-time Payment'
    ]
  }
};

// @desc    Get subscription plans
// @route   GET /api/subscription/plans
// @access  Public
exports.getSubscriptionPlans = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        plans: Object.values(SUBSCRIPTION_PLANS)
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user subscription status
// @route   GET /api/subscription/status
// @access  Private
exports.getSubscriptionStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    const subscriptionStatus = {
      type: user.subscriptionType,
      isActive: user.hasPremiumAccess(),
      expiresAt: user.subscriptionExpiresAt,
      daysRemaining: null
    };

    if (user.subscriptionExpiresAt && user.subscriptionType === 'premium') {
      const now = new Date();
      const expiryDate = new Date(user.subscriptionExpiresAt);
      const timeDiff = expiryDate.getTime() - now.getTime();
      subscriptionStatus.daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    res.status(200).json({
      status: 'success',
      data: {
        subscription: subscriptionStatus
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create subscription
// @route   POST /api/subscription/subscribe
// @access  Private
exports.createSubscription = async (req, res, next) => {
  try {
    const { planId, paymentMethod, paymentDetails } = req.body;

    // Validate plan
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid subscription plan'
      });
    }

    // Here you would integrate with payment gateway (Razorpay, Stripe, etc.)
    // For now, we'll simulate a successful payment
    const paymentSuccess = true; // This would come from payment gateway

    if (!paymentSuccess) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment failed'
      });
    }

    // Update user subscription
    const user = await User.findById(req.user.id);
    user.subscriptionType = 'premium';

    if (plan.duration) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + plan.duration);
      user.subscriptionExpiresAt = expiryDate;
    } else {
      // Lifetime subscription
      user.subscriptionExpiresAt = null;
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Subscription activated successfully',
      data: {
        subscription: {
          type: user.subscriptionType,
          expiresAt: user.subscriptionExpiresAt,
          plan: plan
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel subscription
// @route   POST /api/subscription/cancel
// @access  Private
exports.cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.subscriptionType !== 'premium') {
      return res.status(400).json({
        status: 'error',
        message: 'No active subscription to cancel'
      });
    }

    // For immediate cancellation, set to free
    // For end-of-period cancellation, you might want to add a flag
    user.subscriptionType = 'free';
    user.subscriptionExpiresAt = null;

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Subscription cancelled successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Renew subscription
// @route   POST /api/subscription/renew
// @access  Private
exports.renewSubscription = async (req, res, next) => {
  try {
    const { planId, paymentMethod, paymentDetails } = req.body;

    // Validate plan
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid subscription plan'
      });
    }

    // Here you would integrate with payment gateway
    const paymentSuccess = true; // This would come from payment gateway

    if (!paymentSuccess) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment failed'
      });
    }

    // Update user subscription
    const user = await User.findById(req.user.id);
    user.subscriptionType = 'premium';

    if (plan.duration) {
      // If current subscription is still active, extend from current expiry
      const now = new Date();
      const currentExpiry = user.subscriptionExpiresAt || now;
      const startDate = currentExpiry > now ? currentExpiry : now;
      
      const expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + plan.duration);
      user.subscriptionExpiresAt = expiryDate;
    } else {
      // Lifetime subscription
      user.subscriptionExpiresAt = null;
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Subscription renewed successfully',
      data: {
        subscription: {
          type: user.subscriptionType,
          expiresAt: user.subscriptionExpiresAt,
          plan: plan
        }
      }
    });
  } catch (err) {
    next(err);
  }
};