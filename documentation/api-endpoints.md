# API Endpoints Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the MCQ Surgery backend. Each endpoint includes request/response examples, authentication requirements, and error handling.

## Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format

### Success Response
```json
{
  "status": "success",
  "data": {
    // Response data
  },
  "count": 10,        // For list endpoints
  "pagination": {     // For paginated endpoints
    "next": { "page": 2, "limit": 25 },
    "prev": { "page": 1, "limit": 25 }
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [         // Validation errors
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

---

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "profileData": {
    "college": "AIIMS Delhi",
    "targetExam": "NEET SS",
    "phone": "1234567890"
  }
}
```

**Response (201):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "64a7b8c9d1e2f3g4h5i6j7k8",
      "name": "John Doe",
      "email": "john@example.com",
      "subscriptionType": "free",
      "subscriptionExpiresAt": null,
      "profileData": {
        "college": "AIIMS Delhi",
        "targetExam": "NEET SS",
        "phone": "1234567890"
      }
    }
  }
}
```

### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "64a7b8c9d1e2f3g4h5i6j7k8",
      "name": "John Doe",
      "email": "john@example.com",
      "subscriptionType": "free",
      "subscriptionExpiresAt": null
    }
  }
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "64a7b8c9d1e2f3g4h5i6j7k8",
      "name": "John Doe",
      "email": "john@example.com",
      "subscriptionType": "premium",
      "subscriptionExpiresAt": "2024-12-31T23:59:59.999Z",
      "profileData": {
        "college": "AIIMS Delhi",
        "targetExam": "NEET SS"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLogin": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Forgot Password
```http
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Email sent",
  "resetToken": "abc123def456..." // Only in development
}
```

### Reset Password
```http
PUT /api/auth/reset-password/:resetToken
```

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "64a7b8c9d1e2f3g4h5i6j7k8",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

## MCQ Endpoints

### Get MCQs
```http
GET /api/mcqs?topic=GI Surgery&difficulty=Advanced&page=1&limit=10
```

**Query Parameters:**
- `topic`: Surgery topic (optional)
- `difficulty`: Basic/Intermediate/Advanced (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 25)
- `sort`: Sort criteria (default: -createdAt)

**Response (200):**
```json
{
  "status": "success",
  "count": 10,
  "pagination": {
    "next": { "page": 2, "limit": 10 },
    "prev": null
  },
  "data": {
    "mcqs": [
      {
        "id": "64a7b8c9d1e2f3g4h5i6j7k8",
        "question": "A 60-year-old woman is found to have a 3.2 cm pancreatic cystic lesion...",
        "options": [
          "Diffusion-weighted imaging (DWI) on MRI",
          "Fine-needle aspiration (FNA) with cytology",
          "Contrast-enhanced endoscopic ultrasound (CE-EUS)",
          "Measuring cyst fluid amylase and lipase levels"
        ],
        "topic": "GI Surgery",
        "difficulty": "Advanced",
        "isPremium": false,
        "statistics": {
          "totalAttempts": 150,
          "correctAttempts": 90,
          "averageTime": 45
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Get Single MCQ
```http
GET /api/mcqs/:id
Authorization: Bearer <token> (optional)
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "mcq": {
      "id": "64a7b8c9d1e2f3g4h5i6j7k8",
      "question": "A 60-year-old woman is found to have a 3.2 cm pancreatic cystic lesion...",
      "options": [
        "Diffusion-weighted imaging (DWI) on MRI",
        "Fine-needle aspiration (FNA) with cytology",
        "Contrast-enhanced endoscopic ultrasound (CE-EUS)",
        "Measuring cyst fluid amylase and lipase levels"
      ],
      "correctAnswer": 2,
      "explanation": "Contrast-enhanced endoscopic ultrasound (CE-EUS) is the most definitive approach...",
      "topic": "GI Surgery",
      "difficulty": "Advanced",
      "references": [
        {
          "book": "Schwartz's Principles of Surgery",
          "chapter": "Pancreas",
          "page": "1234"
        }
      ],
      "isPremium": false
    },
    "userAttempt": {
      "selectedAnswer": 2,
      "isCorrect": true,
      "timeSpent": 45,
      "attemptedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Submit MCQ Answer
```http
POST /api/mcqs/:id/submit
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "selectedAnswer": 2,
  "timeSpent": 45
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "isCorrect": true,
    "correctAnswer": 2,
    "explanation": "Contrast-enhanced endoscopic ultrasound (CE-EUS) is the most definitive approach...",
    "references": [
      {
        "book": "Schwartz's Principles of Surgery",
        "chapter": "Pancreas",
        "page": "1234"
      }
    ]
  }
}
```

### Bookmark MCQ
```http
POST /api/mcqs/:id/bookmark
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notes": "Important concept for NEET SS exam"
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "bookmark": {
      "id": "64a7b8c9d1e2f3g4h5i6j7k8",
      "user": "64a7b8c9d1e2f3g4h5i6j7k9",
      "mcq": "64a7b8c9d1e2f3g4h5i6j7k8",
      "notes": "Important concept for NEET SS exam",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get Random MCQs
```http
GET /api/mcqs/random?limit=5&topic=Trauma Surgery
```

**Response (200):**
```json
{
  "status": "success",
  "count": 5,
  "data": {
    "mcqs": [
      // Array of random MCQs
    ]
  }
}
```

---

## Mock Test Endpoints

### Get Mock Tests
```http
GET /api/mock-tests?category=NEET SS&page=1&limit=10
```

**Response (200):**
```json
{
  "status": "success",
  "count": 5,
  "data": {
    "mockTests": [
      {
        "id": "64a7b8c9d1e2f3g4h5i6j7k8",
        "title": "NEET SS Surgery Mock Test 1",
        "description": "Comprehensive mock test covering all surgery topics",
        "duration": 180,
        "totalQuestions": 100,
        "category": "NEET SS",
        "difficulty": "Mixed",
        "isPremium": false,
        "statistics": {
          "totalAttempts": 500,
          "averageScore": 65.5,
          "highestScore": 95,
          "lowestScore": 25
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Start Mock Test
```http
POST /api/mock-tests/:id/start
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "mockTest": {
      "id": "64a7b8c9d1e2f3g4h5i6j7k8",
      "title": "NEET SS Surgery Mock Test 1",
      "duration": 180,
      "totalQuestions": 100,
      "instructions": [
        "This test contains 100 questions to be completed in 180 minutes",
        "Each question carries 4 marks for correct answer",
        "There is negative marking of 1 mark for incorrect answers"
      ]
    },
    "questions": [
      {
        "id": "64a7b8c9d1e2f3g4h5i6j7k9",
        "question": "A 25-year-old male presents after a stab wound...",
        "options": [
          "Pericardiocentesis",
          "Emergency thoracotomy",
          "CT angiography of the chest",
          "Chest tube insertion"
        ],
        "topic": "Trauma Surgery",
        "difficulty": "Advanced"
      }
    ],
    "startTime": "2024-01-15T10:30:00.000Z"
  }
}
```

### Submit Mock Test
```http
POST /api/mock-tests/:id/submit
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "answers": [
    {
      "mcq": "64a7b8c9d1e2f3g4h5i6j7k9",
      "selectedAnswer": 0,
      "timeSpent": 30
    },
    {
      "mcq": "64a7b8c9d1e2f3g4h5i6j7ka",
      "selectedAnswer": 2,
      "timeSpent": 45
    }
  ],
  "startTime": "2024-01-15T10:30:00.000Z",
  "endTime": "2024-01-15T13:30:00.000Z"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "attemptId": "64a7b8c9d1e2f3g4h5i6j7kb",
    "score": 85.5,
    "rank": 15,
    "correctAnswers": 85,
    "wrongAnswers": 12,
    "unanswered": 3,
    "totalTimeSpent": 10800
  }
}
```

### Get Mock Test Results
```http
GET /api/mock-tests/:id/results?attemptId=64a7b8c9d1e2f3g4h5i6j7kb
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "attempt": {
      "id": "64a7b8c9d1e2f3g4h5i6j7kb",
      "score": 85.5,
      "rank": 15,
      "totalQuestions": 100,
      "correctAnswers": 85,
      "wrongAnswers": 12,
      "unanswered": 3,
      "totalTimeSpent": 10800,
      "startedAt": "2024-01-15T10:30:00.000Z",
      "completedAt": "2024-01-15T13:30:00.000Z",
      "answers": [
        {
          "mcq": {
            "id": "64a7b8c9d1e2f3g4h5i6j7k9",
            "question": "A 25-year-old male presents after a stab wound...",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": 0,
            "explanation": "Detailed explanation...",
            "topic": "Trauma Surgery"
          },
          "selectedAnswer": 0,
          "isCorrect": true,
          "timeSpent": 30
        }
      ]
    }
  }
}
```

---

## User Dashboard Endpoints

### Get Dashboard
```http
GET /api/user/dashboard
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalAttempted": 250,
      "correctAnswers": 200,
      "accuracy": 80.0,
      "totalBookmarks": 45,
      "mockTestsAttempted": 8
    },
    "recentMockTests": [
      {
        "id": "64a7b8c9d1e2f3g4h5i6j7kb",
        "mockTest": {
          "title": "NEET SS Surgery Mock Test 1"
        },
        "score": 85.5,
        "completedAt": "2024-01-15T13:30:00.000Z"
      }
    ],
    "topicPerformance": [
      {
        "topic": "GI Surgery",
        "total": 50,
        "correct": 40,
        "accuracy": 80.0
      },
      {
        "topic": "Trauma Surgery",
        "total": 30,
        "correct": 25,
        "accuracy": 83.33
      }
    ]
  }
}
```

### Get User Progress
```http
GET /api/user/progress?timeframe=30
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "dailyProgress": [
      {
        "date": "2024-01-15",
        "total": 10,
        "correct": 8,
        "accuracy": 80.0
      }
    ],
    "weeklyMockTests": [
      {
        "week": "2024-02",
        "averageScore": 75.5,
        "count": 2
      }
    ]
  }
}
```

---

## Subscription Endpoints

### Get Subscription Plans
```http
GET /api/subscription/plans
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "plans": [
      {
        "id": "monthly",
        "name": "Monthly Premium",
        "price": 299,
        "currency": "INR",
        "duration": 30,
        "features": [
          "Access to 9000+ Premium MCQs",
          "Unlimited Mock Tests",
          "Detailed Performance Analytics",
          "WhatsApp Group Access",
          "Expert Doubt Resolution",
          "Mobile App Access"
        ]
      },
      {
        "id": "yearly",
        "name": "Yearly Premium",
        "price": 2999,
        "currency": "INR",
        "duration": 365,
        "features": [
          "Access to 9000+ Premium MCQs",
          "Unlimited Mock Tests",
          "Detailed Performance Analytics",
          "WhatsApp Group Access",
          "Expert Doubt Resolution",
          "Mobile App Access",
          "Priority Support",
          "2 Months Free (Best Value)"
        ]
      }
    ]
  }
}
```

### Subscribe to Plan
```http
POST /api/subscription/subscribe
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "planId": "yearly",
  "paymentMethod": "razorpay",
  "paymentDetails": {
    "paymentId": "pay_xxxxx",
    "orderId": "order_xxxxx"
  }
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Subscription activated successfully",
  "data": {
    "subscription": {
      "type": "premium",
      "expiresAt": "2025-01-15T10:30:00.000Z",
      "plan": {
        "id": "yearly",
        "name": "Yearly Premium",
        "price": 2999
      }
    }
  }
}
```

---

## Discussion Endpoints

### Get Discussions
```http
GET /api/discussion?category=doubt&topic=GI Surgery&page=1&limit=20
```

**Response (200):**
```json
{
  "status": "success",
  "count": 15,
  "data": {
    "discussions": [
      {
        "id": "64a7b8c9d1e2f3g4h5i6j7k8",
        "title": "Doubt about pancreatic cystic lesions",
        "content": "I'm confused about the diagnostic approach...",
        "category": "doubt",
        "topic": "GI Surgery",
        "user": {
          "name": "John Doe",
          "profileData": {
            "college": "AIIMS Delhi"
          }
        },
        "replyCount": 3,
        "likeCount": 5,
        "views": 25,
        "isResolved": false,
        "isPinned": false,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### Create Discussion
```http
POST /api/discussion
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Doubt about pancreatic cystic lesions",
  "content": "I'm confused about the diagnostic approach for pancreatic cystic lesions. Can someone explain the difference between CE-EUS and FNA?",
  "category": "doubt",
  "topic": "GI Surgery",
  "relatedMCQ": "64a7b8c9d1e2f3g4h5i6j7k8"
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "discussion": {
      "id": "64a7b8c9d1e2f3g4h5i6j7k9",
      "title": "Doubt about pancreatic cystic lesions",
      "content": "I'm confused about the diagnostic approach...",
      "category": "doubt",
      "topic": "GI Surgery",
      "user": {
        "name": "John Doe",
        "profileData": {
          "college": "AIIMS Delhi"
        }
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

## Error Codes

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

### Custom Error Codes
- `PREMIUM_REQUIRED`: Premium subscription needed
- `VALIDATION_ERROR`: Input validation failed
- `DUPLICATE_ENTRY`: Resource already exists

### Common Error Responses

#### Validation Error (400)
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters long"
    }
  ]
}
```

#### Authentication Error (401)
```json
{
  "status": "error",
  "message": "Not authorized to access this route"
}
```

#### Premium Required (403)
```json
{
  "status": "error",
  "message": "Premium subscription required to access this content",
  "code": "PREMIUM_REQUIRED"
}
```