# Routes Documentation

## Overview

Routes define the API endpoints and map HTTP requests to controller functions. Each route file handles a specific domain of functionality and includes input validation middleware.

---

## `auth.js`

### Purpose
Handles user authentication, registration, password management, and profile updates.

### Endpoints

#### `POST /api/auth/register`
**Purpose**: Register a new user account

**Validation**:
- `name`: 2-50 characters, trimmed
- `email`: Valid email format, normalized
- `password`: Minimum 6 characters

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "profileData": {
    "college": "AIIMS Delhi",
    "targetExam": "NEET SS"
  }
}
```

**Response**: User object with JWT token

#### `POST /api/auth/login`
**Purpose**: Authenticate existing user

**Validation**:
- `email`: Valid email format
- `password`: Required

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**: User object with JWT token

#### `GET /api/auth/logout`
**Purpose**: Log out user (client-side token removal)
**Access**: Public
**Response**: Success message

#### `GET /api/auth/me`
**Purpose**: Get current authenticated user details
**Access**: Protected (requires JWT)
**Response**: Current user object

#### `POST /api/auth/forgot-password`
**Purpose**: Initiate password reset process

**Validation**:
- `email`: Valid email format

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Response**: Success message with reset token (for testing)

#### `PUT /api/auth/reset-password/:resetToken`
**Purpose**: Reset password using reset token

**Validation**:
- `password`: Minimum 6 characters

**Request Body**:
```json
{
  "password": "newpassword123"
}
```

**Response**: User object with new JWT token

#### `PUT /api/auth/update-details`
**Purpose**: Update user profile information
**Access**: Protected

**Request Body**:
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "profileData": {
    "college": "New College",
    "phone": "1234567890"
  }
}
```

#### `PUT /api/auth/update-password`
**Purpose**: Change user password
**Access**: Protected

**Validation**:
- `currentPassword`: Required
- `newPassword`: Minimum 6 characters

**Request Body**:
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## `mcq.js`

### Purpose
Manages MCQ operations including retrieval, creation, answering, and bookmarking.

### Endpoints

#### `GET /api/mcqs`
**Purpose**: Get MCQs with filtering, sorting, and pagination
**Access**: Public/Private (premium content filtered based on subscription)

**Query Parameters**:
- `topic`: Filter by surgery topic
- `difficulty`: Filter by difficulty level
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 25)
- `sort`: Sort criteria

**Example**: `/api/mcqs?topic=GI Surgery&difficulty=Advanced&page=1&limit=10`

#### `GET /api/mcqs/random`
**Purpose**: Get random MCQs for practice
**Access**: Public/Private

**Query Parameters**:
- `limit`: Number of random MCQs (default: 10)
- `topic`: Filter by topic
- `difficulty`: Filter by difficulty

#### `GET /api/mcqs/bookmarked`
**Purpose**: Get user's bookmarked MCQs
**Access**: Protected

#### `GET /api/mcqs/:id`
**Purpose**: Get single MCQ with details
**Access**: Public/Private (premium check applied)

**Response**: MCQ object with user's previous attempt (if authenticated)

#### `POST /api/mcqs`
**Purpose**: Create new MCQ (Admin functionality)
**Access**: Protected

**Validation**:
- `question`: Required, trimmed
- `options`: Array of 2-6 strings
- `correctAnswer`: Valid option index
- `explanation`: Required
- `topic`: Required from predefined list
- `difficulty`: Basic/Intermediate/Advanced

#### `PUT /api/mcqs/:id`
**Purpose**: Update existing MCQ
**Access**: Protected

#### `DELETE /api/mcqs/:id`
**Purpose**: Delete MCQ
**Access**: Protected

#### `POST /api/mcqs/:id/submit`
**Purpose**: Submit answer for MCQ
**Access**: Protected

**Validation**:
- `selectedAnswer`: Valid option index
- `timeSpent`: Optional positive number

**Request Body**:
```json
{
  "selectedAnswer": 2,
  "timeSpent": 45
}
```

**Response**: Correct answer, explanation, and references

#### `POST /api/mcqs/:id/bookmark`
**Purpose**: Bookmark MCQ
**Access**: Protected

**Request Body**:
```json
{
  "notes": "Important concept for exam"
}
```

#### `DELETE /api/mcqs/:id/bookmark`
**Purpose**: Remove bookmark
**Access**: Protected

---

## `mockTest.js`

### Purpose
Handles mock test operations including creation, starting tests, submission, and results.

### Endpoints

#### `GET /api/mock-tests`
**Purpose**: Get available mock tests
**Access**: Public/Private (premium filtering applied)

**Query Parameters**:
- `category`: Filter by test category
- `difficulty`: Filter by difficulty
- `page`, `limit`, `sort`: Pagination and sorting

#### `GET /api/mock-tests/:id`
**Purpose**: Get mock test details
**Access**: Public/Private

**Response**: Mock test info with user's previous attempts

#### `POST /api/mock-tests`
**Purpose**: Create new mock test
**Access**: Protected

**Validation**:
- `title`: Required
- `duration`: Minimum 1 minute
- `questions`: Array of MCQ IDs

#### `PUT /api/mock-tests/:id`
**Purpose**: Update mock test
**Access**: Protected

#### `DELETE /api/mock-tests/:id`
**Purpose**: Delete mock test
**Access**: Protected

#### `POST /api/mock-tests/:id/start`
**Purpose**: Start mock test session
**Access**: Protected

**Response**: Questions without answers, start time, test details

#### `POST /api/mock-tests/:id/submit`
**Purpose**: Submit completed mock test
**Access**: Protected

**Validation**:
- `answers`: Array of answer objects
- Each answer must have `mcq` and `selectedAnswer`

**Request Body**:
```json
{
  "answers": [
    {
      "mcq": "mcq_id_1",
      "selectedAnswer": 1,
      "timeSpent": 30
    }
  ],
  "startTime": "2024-01-01T10:00:00Z",
  "endTime": "2024-01-01T11:30:00Z"
}
```

**Response**: Score, rank, and performance summary

#### `GET /api/mock-tests/:id/results`
**Purpose**: Get detailed test results
**Access**: Protected

**Query Parameters**:
- `attemptId`: Required - specific attempt ID

#### `GET /api/mock-tests/:id/leaderboard`
**Purpose**: Get test leaderboard
**Access**: Public

**Query Parameters**:
- `limit`: Number of top performers (default: 10)

---

## `user.js`

### Purpose
Provides user dashboard, profile management, and progress tracking.

### Endpoints

#### `GET /api/user/profile`
**Purpose**: Get user profile
**Access**: Protected

#### `PUT /api/user/profile`
**Purpose**: Update user profile
**Access**: Protected

**Request Body**:
```json
{
  "name": "Updated Name",
  "profileData": {
    "college": "New College",
    "yearOfStudy": "Final Year"
  }
}
```

#### `GET /api/user/dashboard`
**Purpose**: Get dashboard analytics
**Access**: Protected

**Response**:
```json
{
  "stats": {
    "totalAttempted": 150,
    "correctAnswers": 120,
    "accuracy": 80.0,
    "totalBookmarks": 25,
    "mockTestsAttempted": 5
  },
  "recentMockTests": [...],
  "topicPerformance": [...]
}
```

#### `GET /api/user/progress`
**Purpose**: Get detailed progress analytics
**Access**: Protected

**Query Parameters**:
- `timeframe`: Days to analyze (default: 30)

#### `GET /api/user/attempts`
**Purpose**: Get user's MCQ attempt history
**Access**: Protected

#### `GET /api/user/mock-test-history`
**Purpose**: Get mock test attempt history
**Access**: Protected

---

## `subscription.js`

### Purpose
Manages subscription plans, user subscriptions, and payment processing.

### Endpoints

#### `GET /api/subscription/plans`
**Purpose**: Get available subscription plans
**Access**: Public

**Response**:
```json
{
  "plans": [
    {
      "id": "monthly",
      "name": "Monthly Premium",
      "price": 299,
      "currency": "INR",
      "duration": 30,
      "features": [...]
    }
  ]
}
```

#### `GET /api/subscription/status`
**Purpose**: Get user's subscription status
**Access**: Protected

#### `POST /api/subscription/subscribe`
**Purpose**: Subscribe to a plan
**Access**: Protected

**Request Body**:
```json
{
  "planId": "yearly",
  "paymentMethod": "razorpay",
  "paymentDetails": {
    "paymentId": "pay_xxxxx"
  }
}
```

#### `POST /api/subscription/cancel`
**Purpose**: Cancel subscription
**Access**: Protected

#### `POST /api/subscription/renew`
**Purpose**: Renew subscription
**Access**: Protected

---

## `discussion.js`

### Purpose
Handles forum discussions, community interactions, and group links.

### Endpoints

#### `GET /api/discussion`
**Purpose**: Get discussions with filtering
**Access**: Public/Private

**Query Parameters**:
- `category`: Filter by discussion category
- `topic`: Filter by surgery topic
- `page`, `limit`, `sort`: Pagination

#### `GET /api/discussion/groups`
**Purpose**: Get WhatsApp/Telegram group links
**Access**: Public

#### `GET /api/discussion/:id`
**Purpose**: Get single discussion with replies
**Access**: Public/Private

#### `POST /api/discussion`
**Purpose**: Create new discussion
**Access**: Protected

**Validation**:
- `title`: 5-200 characters
- `content`: Minimum 10 characters
- `category`: Valid category

#### `PUT /api/discussion/:id`
**Purpose**: Update discussion (owner only)
**Access**: Protected

#### `DELETE /api/discussion/:id`
**Purpose**: Delete discussion (owner only)
**Access**: Protected

#### `POST /api/discussion/:id/reply`
**Purpose**: Add reply to discussion
**Access**: Protected

**Validation**:
- `content`: Minimum 5 characters

#### `POST /api/discussion/:id/like`
**Purpose**: Like discussion
**Access**: Protected

#### `DELETE /api/discussion/:id/like`
**Purpose**: Unlike discussion
**Access**: Protected

---

## Common Patterns

### Validation Middleware
All routes use `express-validator` for input validation:
```javascript
const validation = [
  body('field').validation().withMessage('Error message')
];
router.post('/endpoint', validation, controller);
```

### Error Handling
All routes automatically pass errors to the global error handler:
```javascript
// In controller
if (error) {
  return next(error); // Passes to errorHandler middleware
}
```

### Pagination
List endpoints support pagination:
```javascript
const page = parseInt(req.query.page, 10) || 1;
const limit = parseInt(req.query.limit, 10) || 25;
```

### Response Format
Consistent response structure:
```json
{
  "status": "success",
  "count": 10,
  "pagination": {...},
  "data": {...}
}
```