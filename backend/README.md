# Memostream Backend API

Complete backend API for the Memostream application with all endpoints required by the frontend.

## Features

✅ **Authentication System**
- User registration and login
- JWT token-based authentication
- Role-based access control (Admin, Staff, Student)

✅ **Memo Management**
- Create, read, update, delete memos
- Status tracking (sent, delivered, read, acknowledged)
- Archive functionality
- Department-based distribution

✅ **User Statistics**
- Total memos count
- Memos sent count
- Archived memos count

✅ **CORS Configuration**
- Properly configured for Next.js frontend
- Supports all required HTTP methods

## Quick Start

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   # Or update MONGO_URI in .env for your MongoDB instance
   ```

4. **Start the Server**
   ```bash
   npm run dev  # Development with nodemon
   # or
   npm start    # Production
   ```

5. **Verify Setup**
   - Server runs on http://localhost:5000
   - API endpoints available at http://localhost:5000/api
   - Health check: GET http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Public user registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires auth)

### Memos
- `GET /api/memos` - Get user's memos (requires auth)
- `POST /api/memos` - Create new memo (requires auth)
- `GET /api/memos/:id` - Get specific memo (requires auth)
- `PUT /api/memos/status` - Update memo status (requires auth)
- `PUT /api/memos/archive/:memoId` - Archive memo (requires auth)

### Statistics
- `GET /api/stats/user` - Get user statistics (requires auth)

### Users (Admin only)
- `GET /api/users` - Get all users
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Fields (Admin only for creation)
- `GET /api/fields` - Get memo fields
- `POST /api/fields` - Create memo field (admin only)

## Response Format

All API responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info"
}
```

## Environment Variables

```bash
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/memostream
JWT_SECRET=your_jwt_secret_key_here

# Optional email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Frontend Integration

This backend is specifically designed to work with the Next.js frontend in the parent directory. The API endpoints match exactly what the frontend expects:

- **Memo fetching**: `useFetchMemos()` → `GET /api/memos`
- **User stats**: `useUserStats()` → `GET /api/stats/user`
- **Authentication**: `authApi.login()` → `POST /api/auth/login`

## Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Start production server
npm start
```

The server will automatically:
- Connect to MongoDB
- Set up CORS for the frontend
- Enable JSON parsing
- Apply authentication middleware
- Handle errors gracefully
