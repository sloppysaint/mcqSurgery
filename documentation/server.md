# `server.js` Documentation

## Purpose

`server.js` is the main entry point of the MCQ Surgery backend application. It sets up the Express.js server, configures middleware, establishes the database connection, defines the main routes, and starts the server.

## Key Components

1.  **Express.js Setup**: Initializes the Express application.
2.  **Middleware Configuration**: Integrates various middleware for security, logging, rate limiting, and CORS.
    *   `helmet()`: Sets various HTTP headers for security.
    *   `express-rate-limit`: Protects against brute-force attacks and excessive requests.
    *   `cors()`: Enables Cross-Origin Resource Sharing, allowing the frontend to communicate with the backend.
    *   `express.json()` and `express.urlencoded()`: Parse incoming JSON and URL-encoded requests.
    *   `morgan("dev")`: Logs HTTP requests in development mode for debugging.
3.  **Database Connection**: Connects to MongoDB using Mongoose. The connection URI is fetched from environment variables (`process.env.MONGODB_URI`).
4.  **Route Integration**: Imports and mounts all API routes (`authRoutes`, `userRoutes`, `mcqRoutes`, `mockTestRoutes`, `subscriptionRoutes`, `discussionRoutes`) under their respective base paths (e.g., `/api/auth`).
5.  **Health Check Endpoint**: Provides a simple `/api/health` endpoint to check if the server is running.
6.  **Error Handling**: Includes a 404 handler for undefined routes and a global error handling middleware (`errorHandler`) to catch and process errors consistently.
7.  **Server Start**: Listens for incoming requests on the specified `PORT` (from environment variables) and logs a confirmation message.

## Flow of Execution

1.  **Environment Loading**: `dotenv` loads environment variables from the `.env` file.
2.  **Middleware Application**: Incoming requests pass through security, logging, and parsing middleware.
3.  **Route Matching**: Express attempts to match the request URL to one of the defined routes.
4.  **Controller Execution**: If a route matches, the corresponding controller function is executed.
5.  **Database Interaction**: Controllers interact with Mongoose models to perform CRUD operations on the MongoDB database.
6.  **Response**: The server sends a JSON response back to the client.
7.  **Error Handling**: If any error occurs during this process, the `errorHandler` middleware catches it and sends a standardized error response.

## Dependencies

*   `express`: Web framework for Node.js.
*   `mongoose`: MongoDB object modeling for Node.js.
*   `cors`: Node.js CORS middleware.
*   `helmet`: Helps secure Express apps by setting various HTTP headers.
*   `morgan`: HTTP request logger middleware for Node.js.
*   `express-rate-limit`: Basic rate-limiting middleware for Express.
*   `dotenv`: Loads environment variables from a `.env` file.
*   `./routes/*`: Imports all route modules.
*   `./middleware/errorHandler`: Imports the custom error handling middleware.

## Usage

To start the server, navigate to the project root directory in your terminal and run:

```bash
npm start
# or for development with nodemon
npm run dev
```

Ensure your `.env` file is correctly configured with `MONGODB_URI`, `JWT_SECRET`, and `PORT`.
