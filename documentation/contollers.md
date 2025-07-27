# Controllers Documentation

## Overview

Controllers contain the business logic for handling HTTP requests. They interact with models, process data, and return responses. Each controller corresponds to a specific domain and handles the actual functionality behind the routes.

---

## `auth.js`

### Purpose
Handles all authentication-related operations including user registration, login, password management, and profile updates.

### Functions

#### `register`
**Route**: `POST /api/auth/register`
**Purpose**: Create a new user account

**Process**:
1. Validates input using express-validator
2. Creates new user with hashed password
3. Generates JWT token
4. Returns user data and token

**Key Features**:
- Password automatically hashed via User model pre-save middleware
- Returns sanitized user data (no password)
- Automatic JWT token generation

#### `login`
**Route**: `POST /api/auth/login`
**Purpose**: Authenticate existing user

**Process**:
1. Validates email and password
2. Finds user by email (includes password field)
3. Compares provided password with hashed password
4. Updates last login timestamp
5. Returns user data and new JWT token

**Security Features**:
- Uses bcrypt for password comparison
- Generic error message for invalid credentials
- Updates login tracking

#### `logout`
**Route**: `GET /api/auth/logout`
**Purpose**: Logout user (client-side token removal)

**Note**: Since JWT is stateless, actual logout is handled client-side by removing the token.

#### `getMe`
**Route**: `GET /api/auth/me`
**Purpose**: Get current authenticated user details

**Process**:
1. Uses `protect` middleware to verify JWT
2. Returns current user data from `req.user`

#### `updateDetails`
**Route**: `PUT /api/auth/update-details`
**Purpose**: Update user profile information

**Process**:
1. Updates allowed fields (name, email, profileData)
2. Runs validation on updated data
3. Returns updated user object

#### `updatePassword`
**Route**: `PUT /api/auth/update-password`
**Purpose**: Change user password

**Process**:
1. Validates current password
2. Compares current password with stored hash
3. Updates password (triggers hashing middleware)
4. Returns new JWT token

#### `forgotPassword`
**Route**: `POST /api/auth/forgot-password`
**Purpose**: Initiate password reset process

**Process**:
1. Finds user by email
2. Generates reset token using crypto
3. Sets token expiration (10 minutes)
4. Saves hashed token to database
5. Would send email in production (currently simulated)

#### `resetPassword`
**Route**: `PUT /api/auth/reset-password/:resetToken`
**Purpose**: Reset password using reset token

**Process**:
1. Hashes provided token
2. Finds user with matching token and valid expiration
3. Updates password and clears reset token
4. Returns new JWT token

### Helper Function

#### `sendTokenResponse`
**Purpose**: Standardizes token response format

**Process**:
1. Generates JWT token from user
2. Sets cookie options (if using cookies)
3. Returns consistent response with user data and token

---

## `mcq.js`

### Purpose
Manages all MCQ-related operations including retrieval, creation, answering, and bookmarking.

### Functions

#### `getMCQs`
**Route**: `GET /api/mcqs`
**Purpose**: Get MCQs with filtering, sorting, and pagination

**Features**:
- **Filtering**: By topic, difficulty, premium status
- **Sorting**: Custom sort criteria or default by creation date
- **Pagination**: Page-based with configurable limit
- **Premium Filtering**: Automatically filters premium content for non-premium users
- **Search**: Supports MongoDB query operators

**Query Processing**:
```javascript
// Remove pagination fields from query
const removeFields = ['select', 'sort', 'page', 'limit'];
removeFields.forEach(param => delete reqQuery[param]);

// Convert to MongoDB operators
queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
```

#### `getMCQ`
**Route**: `GET /api/mcqs/:id`
**Purpose**: Get single MCQ with user attempt history

**Process**:
1. Finds MCQ by ID
2. Checks premium access if required
3. Retrieves user's previous attempt (if authenticated)
4. Returns MCQ with attempt data

#### `createMCQ`
**Route**: `POST /api/mcqs`
**Purpose**: Create new MCQ (Admin functionality)

**Validation**:
- Question text required
- 2-6 options required
- Valid correct answer index
- Topic from predefined list
- Difficulty level validation

#### `submitAnswer`
**Route**: `POST /api/mcqs/:id/submit`
**Purpose**: Submit answer for MCQ practice

**Process**:
1. Validates MCQ exists and user has access
2. Checks if answer is correct
3. Updates or creates attempt record
4. Updates MCQ statistics
5. Returns result with explanation

**Features**:
- Prevents duplicate attempts (updates existing)
- Tracks time spent
- Updates global MCQ statistics
- Returns detailed feedback

#### `bookmarkMCQ`
**Route**: `POST /api/mcqs/:id/bookmark`
**Purpose**: Add MCQ to user bookmarks

**Process**:
1. Checks if MCQ exists
2. Prevents duplicate bookmarks
3. Creates bookmark with optional notes

#### `removeBookmark`
**Route**: `DELETE /api/mcqs/:id/bookmark`
**Purpose**: Remove MCQ bookmark

#### `getBookmarkedMCQs`
**Route**: `GET /api/mcqs/bookmarked`
**Purpose**: Get user's bookmarked MCQs with pagination

**Features**:
- Populates MCQ data
- Sorted by bookmark creation date
- Includes user notes

#### `getRandomMCQs`
**Route**: `GET /api/mcqs/random`
**Purpose**: Get random MCQs for practice

**Process**:
1. Builds match criteria (topic, difficulty, premium status)
2. Uses MongoDB aggregation pipeline with `$sample`
3. Returns random selection

---

## `mockTest.js`

### Purpose
Handles mock test operations including creation, execution, and result processing.

### Functions

#### `getMockTests`
**Route**: `GET /api/mock-tests`
**Purpose**: Get available mock tests with filtering

**Features**:
- Filters premium content based on subscription
- Excludes question details in list view
- Supports category and difficulty filtering

#### `getMockTest`
**Route**: `GET /api/mock-tests/:id`
**Purpose**: Get mock test details with user history

**Process**:
1. Retrieves mock test details
2. Checks premium access
3. Gets user's previous attempts
4. Returns comprehensive test information

#### `startMockTest`
**Route**: `POST /api/mock-tests/:id/start`
**Purpose**: Initialize mock test session

**Process**:
1. Validates test access and premium requirements
2. Filters premium MCQs if user lacks access
3. Returns questions without answers/explanations
4. Provides test metadata and start time

**Security**: Questions returned without correct answers to prevent cheating

#### `submitMockTest`
**Route**: `POST /api/mock-tests/:id/submit`
**Purpose**: Process completed mock test

**Complex Process**:
1. **Answer Processing**: Validates each answer against correct answers
2. **Score Calculation**: Calculates percentage score
3. **Individual Tracking**: Creates UserMCQAttempt records for each question
4. **Statistics Update**: Updates both MCQ and MockTest statistics
5. **Result Recording**: Creates comprehensive UserMockTestAttempt record
6. **Ranking**: Calculates user's rank among all test takers

**Performance Metrics**:
- Total score percentage
- Correct/wrong/unanswered counts
- Time analysis
- Comparative ranking

#### `getMockTestResults`
**Route**: `GET /api/mock-tests/:id/results`
**Purpose**: Get detailed test results

**Features**:
- Populates question details with explanations
- Shows user's answers vs correct answers
- Includes performance analytics

#### `getLeaderboard`
**Route**: `GET /api/mock-tests/:id/leaderboard`
**Purpose**: Get test leaderboard

**Features**:
- Sorted by score and completion time
- Includes user profile information
- Configurable result limit

---

## `user.js`

### Purpose
Provides user dashboard functionality, progress tracking, and profile management.

### Functions

#### `getUserDashboard`
**Route**: `GET /api/user/dashboard`
**Purpose**: Get comprehensive dashboard analytics

**Analytics Provided**:
1. **Basic Stats**: Total attempts, correct answers, accuracy
2. **Bookmarks**: Total bookmarked MCQs
3. **Mock Tests**: Number of tests attempted
4. **Recent Performance**: Latest mock test scores
5. **Topic Analysis**: Performance breakdown by surgery topics

**Complex Aggregation**:
```javascript
const topicPerformance = await UserMCQAttempt.aggregate([
  { $match: { user: userId, attemptType: 'practice' } },
  { $lookup: { from: 'mcqs', localField: 'mcq', foreignField: '_id', as: 'mcqData' } },
  { $unwind: '$mcqData' },
  { $group: {
    _id: '$mcqData.topic',
    total: { $sum: 1 },
    correct: { $sum: { $cond: ['$isCorrect', 1, 0] } }
  }}
]);
```

#### `getUserProgress`
**Route**: `GET /api/user/progress`
**Purpose**: Get detailed progress analytics over time

**Features**:
- **Daily Progress**: MCQ attempts and accuracy by day
- **Weekly Mock Tests**: Average scores and attempt frequency
- **Configurable Timeframe**: Default 30 days, customizable
- **Trend Analysis**: Performance trends over time

#### `getUserAttempts`
**Route**: `GET /api/user/attempts`
**Purpose**: Get paginated MCQ attempt history

**Features**:
- Populates MCQ details (question, topic, difficulty)
- Sorted by attempt date
- Pagination support

#### `getUserMockTestHistory`
**Route**: `GET /api/user/mock-test-history`
**Purpose**: Get mock test attempt history

**Features**:
- Populates test details
- Performance summary for each attempt
- Sorted by completion date

---

## `subscription.js`

### Purpose
Manages subscription plans, user subscriptions, and payment processing.

### Configuration

#### Subscription Plans
```javascript
const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Premium',
    price: 299,
    currency: 'INR',
    duration: 30,
    features: [...]
  },
  yearly: { ... },
  lifetime: { ... }
};
```

### Functions

#### `getSubscriptionPlans`
**Route**: `GET /api/subscription/plans`
**Purpose**: Return available subscription plans

#### `getSubscriptionStatus`
**Route**: `GET /api/subscription/status`
**Purpose**: Get user's current subscription status

**Features**:
- Active/inactive status
- Expiration date
- Days remaining calculation

#### `createSubscription`
**Route**: `POST /api/subscription/subscribe`
**Purpose**: Process new subscription

**Process**:
1. Validates plan selection
2. **Payment Processing**: Currently simulated, ready for gateway integration
3. Updates user subscription status
4. Sets expiration date based on plan duration

**Payment Integration Ready**:
```javascript
// Placeholder for payment gateway integration
const paymentSuccess = true; // Replace with actual payment processing
```

#### `cancelSubscription`
**Route**: `POST /api/subscription/cancel`
**Purpose**: Cancel active subscription

#### `renewSubscription`
**Route**: `POST /api/subscription/renew`
**Purpose**: Renew existing subscription

**Features**:
- Extends from current expiry date if still active
- Handles expired subscriptions

---

## `discussion.js`

### Purpose
Manages forum discussions, community interactions, and group access.

### Configuration

#### Group Links
```javascript
const GROUP_LINKS = {
  whatsapp: {
    general: 'https://chat.whatsapp.com/general-surgery-group',
    neetss: 'https://chat.whatsapp.com/neet-ss-surgery-group',
    iniss: 'https://chat.whatsapp.com/ini-ss-surgery-group'
  },
  telegram: { ... }
};
```

### Functions

#### `getDiscussions`
**Route**: `GET /api/discussion`
**Purpose**: Get discussions with filtering and pagination

**Features**:
- Category and topic filtering
- Pinned discussions prioritized
- User information populated

#### `getDiscussion`
**Route**: `GET /api/discussion/:id`
**Purpose**: Get single discussion with replies

**Features**:
- Populates user and reply user information
- Increments view count
- Includes related MCQ if applicable

#### `createDiscussion`
**Route**: `POST /api/discussion`
**Purpose**: Create new discussion

#### `addReply`
**Route**: `POST /api/discussion/:id/reply`
**Purpose**: Add reply to discussion

**Features**:
- Expert reply flagging
- User information population

#### `likeDiscussion` / `unlikeDiscussion`
**Routes**: `POST/DELETE /api/discussion/:id/like`
**Purpose**: Manage discussion likes

**Features**:
- Prevents duplicate likes
- Returns updated like count

---

## Common Patterns

### Error Handling
All controllers use try-catch blocks and pass errors to middleware:
```javascript
try {
  // Controller logic
} catch (err) {
  next(err);
}
```

### Validation
Controllers check express-validator results:
```javascript
const errors = validationResult(req);
if (!errors.isEmpty()) {
  return res.status(400).json({
    status: 'error',
    message: 'Validation failed',
    errors: errors.array()
  });
}
```

### Response Format
Consistent response structure:
```javascript
res.status(200).json({
  status: 'success',
  data: { ... }
});
```

### Pagination
Standard pagination implementation:
```javascript
const page = parseInt(req.query.page, 10) || 1;
const limit = parseInt(req.query.limit, 10) || 25;
const startIndex = (page - 1) * limit;
```

### Population
Mongoose populate for related data:
```javascript
.populate('user', 'name profileData.college')
.populate('mcq', 'question topic difficulty')
```