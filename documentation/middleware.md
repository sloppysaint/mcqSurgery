# Middleware Documentation

## Overview

Middleware functions are executed during the request-response cycle and can modify request/response objects, end the request-response cycle, or call the next middleware function. The MCQ Surgery backend uses custom middleware for authentication, authorization, and error handling.

---

## `auth.js`

### Purpose
Provides authentication and authorization middleware functions to protect routes and control access based on user status and subscription level.

### Functions

#### `protect`
**Purpose**: Verifies JWT token and authenticates users for protected routes.

**Flow**:
1. Extracts JWT token from `Authorization` header (Bearer token format)
2. Verifies token using `JWT_SECRET`
3. Retrieves user from database using token payload
4. Checks if user exists and is active
5. Attaches user object to `req.user` for use in subsequent middleware/controllers

**Usage**:
```javascript
router.get('/protected-route', protect, controllerFunction);
```

**Error Responses**:
- `401`: No token provided
- `401`: Invalid token
- `401`: User not found
- `401`: User account deactivated

#### `authorize(...roles)`
**Purpose**: Restricts access based on user roles (currently not implemented in User model but structure is ready).

**Parameters**:
- `roles`: Array of allowed roles

**Usage**:
```javascript
router.delete('/admin-only', protect, authorize('admin'), controllerFunction);
```

#### `requirePremium`
**Purpose**: Ensures user has active premium subscription to access premium content.

**Flow**:
1. Checks if user has premium subscription type
2. Validates subscription expiry date (if applicable)
3. Allows access if subscription is valid

**Usage**:
```javascript
router.get('/premium-content', protect, requirePremium, controllerFunction);
```

**Error Response**:
- `403`: Premium subscription required with code `PREMIUM_REQUIRED`

#### `optionalAuth`
**Purpose**: Attempts authentication but doesn't fail if no token is provided. Useful for endpoints that work for both authenticated and anonymous users.

**Flow**:
1. Checks for JWT token
2. If token exists, verifies and attaches user to request
3. If no token or invalid token, continues without user
4. Sets `req.user = null` if authentication fails

**Usage**:
```javascript
router.get('/public-or-private', optionalAuth, controllerFunction);
```

### Implementation Details

#### Token Extraction
```javascript
if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
  token = req.headers.authorization.split(' ')[1];
}
```

#### User Verification
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = await User.findById(decoded.id);
```

#### Premium Access Check
```javascript
if (!req.user.hasPremiumAccess()) {
  return res.status(403).json({
    status: 'error',
    message: 'Premium subscription required',
    code: 'PREMIUM_REQUIRED'
  });
}
```

---

## `errorHandler.js`

### Purpose
Centralized error handling middleware that catches all errors in the application and returns consistent error responses to clients.

### Error Types Handled

#### 1. Mongoose CastError
**Cause**: Invalid ObjectId format
**Response**: 404 - "Resource not found"

#### 2. Mongoose Duplicate Key Error (Code 11000)
**Cause**: Attempting to create duplicate unique field
**Response**: 400 - "Duplicate field value entered"

#### 3. Mongoose ValidationError
**Cause**: Schema validation failures
**Response**: 400 - Combined validation error messages

#### 4. JWT Errors
- **JsonWebTokenError**: Invalid token format
- **TokenExpiredError**: Expired token
**Response**: 401 - "Invalid token" or "Token expired"

#### 5. Generic Errors
**Response**: 500 - "Server Error" (or custom message)

### Error Response Format

#### Development Mode
```json
{
  "status": "error",
  "message": "Error description",
  "stack": "Error stack trace"
}
```

#### Production Mode
```json
{
  "status": "error",
  "message": "Error description"
}
```

### Implementation

```javascript
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.log(err);

  // Handle specific error types
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

### Usage in Express App

```javascript
// Must be the last middleware
app.use(errorHandler);
```

### Error Logging
- Logs all errors to console for debugging
- In production, you might want to integrate with logging services like Winston or external services like Sentry

### Best Practices

1. **Consistent Format**: All errors return the same JSON structure
2. **Security**: Doesn't expose sensitive information in production
3. **Debugging**: Includes stack traces in development
4. **User-Friendly**: Provides meaningful error messages
5. **HTTP Status Codes**: Uses appropriate status codes for different error types

### Custom Error Creation

Controllers can create custom errors:

```javascript
// In controller
const error = new Error('Custom error message');
error.statusCode = 400;
throw error;
```

The error handler will catch and format this appropriately.

---

## Middleware Chain Example

```javascript
// Route with multiple middleware
router.get('/premium-mcqs', 
  optionalAuth,           // Try to authenticate
  requirePremium,         // Check premium status
  getMCQs                 // Controller function
);

// Error handling flow
router.post('/create-mcq',
  protect,                // Must be authenticated
  validateMCQ,           // Validation middleware
  createMCQ              // Controller
);
// If any middleware throws error, errorHandler catches it
```

This middleware architecture ensures secure, consistent, and maintainable request handling throughout the application.