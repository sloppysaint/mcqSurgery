# MCQ Surgery Backend

A comprehensive Express.js backend API for MCQ Surgery platform - helping surgery aspirants crack NEET SS and MCH exams with 9000+ high-yield MCQs, mock tests, and expert explanations.

## Features

- **User Management**: Registration, authentication, profile management
- **MCQ System**: 9000+ categorized MCQs with detailed explanations
- **Mock Tests**: Timed exams with performance analytics
- **Subscription Management**: Free and Premium tiers
- **Progress Tracking**: Detailed analytics and performance insights
- **Discussion Forum**: Peer-to-peer interaction and doubt resolution
- **Bookmarking**: Save important MCQs for later review

## Tech Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Password Hashing**: bcryptjs

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mcq-surgery-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/mcq-surgery
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development

# Email configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment gateway (Razorpay/Stripe)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# CORS origin
CORS_ORIGIN=http://localhost:3000
```

5. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

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

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### MCQ Endpoints

#### Get MCQs (with filtering)
```http
GET /api/mcqs?topic=GI Surgery&difficulty=Intermediate&page=1&limit=25
Authorization: Bearer <token> (optional)
```

#### Get Single MCQ
```http
GET /api/mcqs/:id
Authorization: Bearer <token> (optional)
```

#### Submit MCQ Answer
```http
POST /api/mcqs/:id/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "selectedAnswer": 2,
  "timeSpent": 45
}
```

#### Bookmark MCQ
```http
POST /api/mcqs/:id/bookmark
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Important concept for NEET SS"
}
```

### Mock Test Endpoints

#### Get Mock Tests
```http
GET /api/mock-tests?category=NEET SS&page=1&limit=10
Authorization: Bearer <token> (optional)
```

#### Start Mock Test
```http
POST /api/mock-tests/:id/start
Authorization: Bearer <token>
```

#### Submit Mock Test
```http
POST /api/mock-tests/:id/submit
Authorization: Bearer <token>
Content-Type: application/json

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

### User Dashboard

#### Get Dashboard Data
```http
GET /api/user/dashboard
Authorization: Bearer <token>
```

#### Get User Progress
```http
GET /api/user/progress?timeframe=30
Authorization: Bearer <token>
```

### Subscription Endpoints

#### Get Subscription Plans
```http
GET /api/subscription/plans
```

#### Subscribe to Plan
```http
POST /api/subscription/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "yearly",
  "paymentMethod": "razorpay",
  "paymentDetails": {
    "paymentId": "pay_xxxxx"
  }
}
```

## Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  subscriptionType: String (free/premium),
  subscriptionExpiresAt: Date,
  profileData: {
    phone: String,
    college: String,
    yearOfStudy: String,
    targetExam: String
  }
}
```

### MCQ Model
```javascript
{
  question: String,
  options: [String],
  correctAnswer: Number,
  explanation: String,
  topic: String,
  difficulty: String,
  references: [{
    book: String,
    chapter: String,
    page: String
  }],
  isPremium: Boolean
}
```

### Mock Test Model
```javascript
{
  title: String,
  description: String,
  duration: Number (minutes),
  questions: [ObjectId],
  totalQuestions: Number,
  isPremium: Boolean,
  category: String
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Rate Limiting**: Prevents API abuse
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express apps
- **Input Validation**: Express Validator for request validation

## Error Handling

The API uses consistent error response format:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [] // Validation errors if any
}
```

## Success Response Format

```json
{
  "status": "success",
  "data": {
    // Response data
  },
  "pagination": {
    // Pagination info for list endpoints
    "next": { "page": 2, "limit": 25 },
    "prev": { "page": 1, "limit": 25 }
  }
}
```

## Development

### Project Structure
```
mcq-surgery-backend/
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── models/            # Mongoose models
├── routes/            # Express routes
├── utils/             # Utility functions
├── config/            # Configuration files
├── server.js          # Main server file
├── package.json       # Dependencies
└── README.md          # Documentation
```

### Adding New Features

1. Create model in `models/` directory
2. Add controller logic in `controllers/`
3. Define routes in `routes/`
4. Add middleware if needed
5. Update documentation

