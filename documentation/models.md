 Models Documentation

## Overview

The models directory contains all Mongoose schemas that define the structure of documents in the MongoDB database. Each model represents a collection in the database and includes validation rules, middleware, and custom methods.

---

## `User.js`

### Purpose
Defines the user schema for authentication, profile management, and subscription handling.

### Schema Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | User's full name (max 50 characters) |
| `email` | String | Yes | Unique email address with validation |
| `password` | String | Yes | Hashed password (min 6 characters) |
| `subscriptionType` | String | No | 'free' or 'premium' (default: 'free') |
| `subscriptionExpiresAt` | Date | No | Premium subscription expiry date |
| `profileData` | Object | No | Additional profile information |
| `resetPasswordToken` | String | No | Token for password reset |
| `resetPasswordExpire` | Date | No | Password reset token expiry |
| `isActive` | Boolean | No | Account status (default: true) |
| `lastLogin` | Date | No | Last login timestamp |

### Profile Data Structure
```javascript
profileData: {
  phone: String,
  college: String,
  yearOfStudy: String,
  targetExam: String, // 'NEET SS', 'INI SS', 'MCH', 'Other'
  avatar: String
}
```

### Pre-save Middleware
- **Password Hashing**: Automatically hashes passwords using bcrypt before saving

### Instance Methods
- `getSignedJwtToken()`: Generates and returns a JWT token
- `matchPassword(enteredPassword)`: Compares entered password with hashed password
- `getResetPasswordToken()`: Generates password reset token
- `hasPremiumAccess()`: Checks if user has active premium subscription

---

## `MCQ.js`

### Purpose
Defines the structure for Multiple Choice Questions with explanations, categorization, and statistics.

### Schema Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | String | Yes | The question text |
| `options` | Array[String] | Yes | 2-6 answer options |
| `correctAnswer` | Number | Yes | Index of correct option (0-based) |
| `explanation` | String | Yes | Detailed explanation of the answer |
| `topic` | String | Yes | Surgery topic category |
| `difficulty` | String | Yes | 'Basic', 'Intermediate', 'Advanced' |
| `references` | Array[Object] | No | Textbook references |
| `tags` | Array[String] | No | Additional tags for categorization |
| `isPremium` | Boolean | No | Premium content flag (default: false) |
| `isActive` | Boolean | No | Active status (default: true) |
| `createdBy` | ObjectId | No | Reference to User who created |
| `statistics` | Object | No | Usage statistics |

### Topic Categories
- General Surgery, GI Surgery, Urology, Pediatric Surgery
- Cardiothoracic Surgery, Neurosurgery, Orthopedics
- Plastic Surgery, Vascular Surgery, Trauma Surgery
- Oncology, Endocrine Surgery, Hepatobiliary Surgery
- Transplant Surgery, Emergency Surgery, Surgical Anatomy
- Surgical Pathology, Surgical Physiology, Pre and Post Operative Care
- Surgical Instruments, Anesthesia, Other

### Reference Structure
```javascript
references: [{
  book: String,
  chapter: String,
  page: String
}]
```

### Statistics Structure
```javascript
statistics: {
  totalAttempts: Number,
  correctAttempts: Number,
  averageTime: Number
}
```

### Virtual Properties
- `successRate`: Calculated percentage of correct attempts

### Instance Methods
- `updateStatistics(isCorrect, timeSpent)`: Updates MCQ usage statistics

### Indexes
- Compound index on `topic` and `difficulty`
- Index on `isPremium`
- Index on `tags`

---

## `MockTest.js`

### Purpose
Defines the structure for timed mock examinations with questions and analytics.

### Schema Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | Yes | Mock test title |
| `description` | String | No | Test description |
| `duration` | Number | Yes | Duration in minutes |
| `questions` | Array[ObjectId] | Yes | References to MCQ documents |
| `totalQuestions` | Number | Yes | Auto-calculated from questions array |
| `passingScore` | Number | No | Passing percentage (default: 60) |
| `isPremium` | Boolean | No | Premium content flag |
| `isActive` | Boolean | No | Active status |
| `scheduledAt` | Date | No | Scheduled test time |
| `category` | String | No | Test category |
| `topics` | Array[String] | No | Covered topics |
| `difficulty` | String | No | Overall difficulty level |
| `instructions` | Array[String] | No | Test instructions |
| `createdBy` | ObjectId | No | Creator reference |
| `statistics` | Object | No | Test statistics |

### Categories
- 'NEET SS', 'INI SS', 'MCH', 'Topic Wise', 'Mixed'

### Statistics Structure
```javascript
statistics: {
  totalAttempts: Number,
  averageScore: Number,
  highestScore: Number,
  lowestScore: Number
}
```

### Pre-save Middleware
- Automatically sets `totalQuestions` from `questions` array length

### Instance Methods
- `updateStatistics(score)`: Updates test performance statistics

---

## `UserMCQAttempt.js`

### Purpose
Tracks individual MCQ attempts by users for practice and mock tests.

### Schema Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user` | ObjectId | Yes | Reference to User |
| `mcq` | ObjectId | Yes | Reference to MCQ |
| `selectedAnswer` | Number | Yes | User's selected option index |
| `isCorrect` | Boolean | Yes | Whether answer was correct |
| `timeSpent` | Number | No | Time spent in seconds |
| `mockTest` | ObjectId | No | Reference to MockTest (if part of test) |
| `attemptType` | String | No | 'practice' or 'mock_test' |

### Indexes
- Compound unique index on `user`, `mcq`, and `mockTest`
- Index on `user` and `attemptType`
- Index on `user` and `isCorrect`

---

## `UserMockTestAttempt.js`

### Purpose
Records complete mock test attempts with detailed results and analytics.

### Schema Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user` | ObjectId | Yes | Reference to User |
| `mockTest` | ObjectId | Yes | Reference to MockTest |
| `answers` | Array[Object] | Yes | All answers with details |
| `score` | Number | Yes | Final score percentage |
| `totalQuestions` | Number | Yes | Total questions in test |
| `correctAnswers` | Number | Yes | Number of correct answers |
| `wrongAnswers` | Number | Yes | Number of wrong answers |
| `unanswered` | Number | No | Number of unanswered questions |
| `totalTimeSpent` | Number | Yes | Total time in seconds |
| `startedAt` | Date | Yes | Test start time |
| `completedAt` | Date | Yes | Test completion time |
| `isCompleted` | Boolean | No | Completion status |
| `rank` | Number | No | User's rank in test |

### Answer Structure
```javascript
answers: [{
  mcq: ObjectId,
  selectedAnswer: Number,
  isCorrect: Boolean,
  timeSpent: Number
}]
```

### Instance Methods
- `calculateRank()`: Calculates and updates user's rank

### Indexes
- Compound index on `user` and `mockTest`
- Index on `user` and `score` (descending)
- Index on `mockTest` and `score` (descending)

---

## `Bookmark.js`

### Purpose
Manages user bookmarks for MCQs with optional notes.

### Schema Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user` | ObjectId | Yes | Reference to User |
| `mcq` | ObjectId | Yes | Reference to MCQ |
| `notes` | String | No | User's personal notes (max 500 chars) |

### Indexes
- Compound unique index on `user` and `mcq`

---

## `Discussion.js`

### Purpose
Handles forum discussions, doubts, and community interactions.

### Schema Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user` | ObjectId | Yes | Discussion creator |
| `title` | String | Yes | Discussion title (5-200 chars) |
| `content` | String | Yes | Discussion content (min 10 chars) |
| `category` | String | No | Discussion category |
| `topic` | String | No | Surgery topic |
| `relatedMCQ` | ObjectId | No | Related MCQ reference |
| `replies` | Array[Object] | No | Discussion replies |
| `isResolved` | Boolean | No | Resolution status |
| `isPinned` | Boolean | No | Pinned status |
| `views` | Number | No | View count |
| `likes` | Array[ObjectId] | No | User likes |

### Categories
- 'doubt', 'general', 'study_material', 'exam_strategy', 'other'

### Reply Structure
```javascript
replies: [{
  user: ObjectId,
  content: String,
  isExpertReply: Boolean,
  createdAt: Date
}]
```

### Virtual Properties
- `replyCount`: Number of replies
- `likeCount`: Number of likes

### Indexes
- Compound index on `category` and `topic`
- Index on `user`
- Index on `isPinned` and `createdAt` (descending)

---

## Common Patterns

### Timestamps
All models include automatic `createdAt` and `updatedAt` timestamps via:
```javascript
{ timestamps: true }
```

### Population
Models use Mongoose's `populate()` method to include referenced document data in queries.

### Validation
All models include comprehensive validation rules for data integrity and security.