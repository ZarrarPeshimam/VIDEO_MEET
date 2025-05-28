# VideoMeet

Premium video conferencing application built with modern web technologies, providing a seamless meeting experience for users across devices.

![VideoMeet Screenshot](https://github.com/Ananta025/VIDEO_MEET/blob/574fb3c62bfd211917ec66ec7c9cf2dddca2f74a/Frontend/public/screenshot.png)

## 🚀 Features

- **User Authentication** - Secure registration and login system
- **Real-time Video Meetings** - High-quality video and audio communication
- **Screen Sharing** - Share your screen with meeting participants
- **In-Meeting Chat** - Text communication during video calls
- **Meeting History** - View all past meetings with details
- **Responsive Design** - Works on desktop and mobile devices
- **Meeting Security** - Only authorized users can join meetings
- **Meeting Feedback** - Collect user feedback after meetings

## 🛠️ Technology Stack

### Frontend
- React.js with TypeScript
- React Router for navigation
- Socket.io client for real-time communication
- WebRTC for peer-to-peer video streaming
- TailwindCSS for styling
- Material UI components

### Backend
- Node.js
- Express.js
- MongoDB for database
- Mongoose for object modeling
- Socket.io for WebSocket connections
- JWT for authentication
- bcrypt for password hashing

## 📋 Project Structure

```
VIDEO_MEET/
├── Frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── contexts/   # React context providers
│   │   ├── pages/      # Application pages
│   │   ├── routes/     # Routing configuration
│   │   ├── scripts/    # Utility scripts
│   │   ├── styles/     # CSS stylesheets
│   │   └── utils/      # Helper functions
│   └── public/         # Static assets
└── Backend/            # Node.js backend application
    ├── src/
    │   ├── controllers/# Request handlers
    │   ├── models/     # Database models
    │   ├── routes/     # API routes
    │   ├── services/   # Business logic
    │   ├── middlewares/# Express middlewares
    │   └── Db/         # Database connection
    └── .env            # Environment variables
```

## 🔧 Installation

### Prerequisites
- Node.js (v14.x or higher)
- MongoDB (v4.x or higher)
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd Backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root of the Backend directory with the following variables:
   ```
   PORT=5000
   MONGO_URL=mongodb://localhost:27017/videomeet
   JWT_SECRET=your_jwt_secret
   ```

4. Start the server:
   ```
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd Frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root of the Frontend directory with the following variables:
   ```
   VITE_BASE_URL=http://localhost:3000
   VITE_SERVER_URL=http://localhost:3000
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## 📱 Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Create a Meeting**: 
   - Click on "New meeting" button from the home page
   - Share the generated meeting link with others
3. **Join a Meeting**: 
   - Enter the meeting code or link in the input field
   - Click "Join" button
4. **During the Meeting**:
   - Toggle video/audio using the control buttons
   - Share your screen with the screen sharing button
   - Use the chat feature to send messages to participants
   - End the meeting using the red button
5. **View Meeting History**:
   - Navigate to the history page from the navbar
   - See all past and scheduled meetings

## 🔒 Security Features

- JWT authentication for secure API access
- Encrypted password storage with bcrypt
- WebRTC encrypted peer-to-peer connections
- Meeting access validation
- Blacklisted token handling for secure logouts

## 💻 API Endpoints

### User Routes
- `POST /users/register` - Register a new user
- `POST /users/login` - Login existing user
- `GET /users/profile` - Get user profile
- `POST /users/logout` - Logout user
- `GET /users/history` - Get user's meeting history
- `POST /users/history` - Add meeting to history

### Meeting Routes
- `POST /meetings/create` - Create a new meeting
- `POST /meetings/join` - Join an existing meeting
- `POST /meetings/leave` - Leave a meeting
- `POST /meetings/end` - End a meeting
- `GET /meetings/:meetingId` - Get meeting details
- `PUT /meetings/:meetingId` - Update meeting status

## 📝 License

This project is licensed under the MIT License.

## 👥 Contributors

- Ananta Chandra Das - Fullstack Developer

## 🤝 Collaboration

We welcome contributions to the VideoMeet project! Here's how you can collaborate:

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/VIDEO_MEET.git`
3. Add the original repository as upstream: `git remote add upstream https://github.com/original-owner/VIDEO_MEET.git`
4. Create a new branch for your feature: `git checkout -b feature/your-feature-name`

### Development Process

1. Make your changes following the code style guidelines
2. Keep your branch updated with upstream: `git pull upstream main`
3. Write tests for your changes when applicable
4. Ensure all tests pass before submitting

### Code Style Guidelines

- Follow the existing coding style in the project
- Use meaningful variable and function names
- Write comments for complex logic
- Follow TypeScript best practices on frontend
- Follow ES6+ standards for backend JavaScript

### Pull Request Process

1. Update the README.md with details of changes if applicable
2. Push to your fork: `git push origin feature/your-feature-name`
3. Open a pull request against the main branch
4. Clearly describe your changes and link any related issues
5. Wait for code review and address feedback

### Reporting Issues

- Use the issue tracker to report bugs or suggest features
- Check existing issues before opening a new one
- Provide detailed information when reporting bugs:
  - Expected behavior
  - Actual behavior
  - Steps to reproduce
  - Screenshots if applicable

---

Made with ❤️ by Ananta
