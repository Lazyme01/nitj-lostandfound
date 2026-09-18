# NITJ Lost & Found Portal

A full-stack web application for NIT Jalandhar students to report and reclaim lost items on campus.

## Features

- **Google OAuth** — Login restricted to `@nitj.ac.in` email addresses only
- **Item Categories** — Electronics, Stationary, Clothing, Accessories, Documents, Others
- **Post Found Items** — Create posts with images, location, and description (Roll No auto-shown)
- **Real-time Chat** — Private messaging between students with Socket.IO
- **Image Sharing** — Send photos in personal chat via Cloudinary
- **Resolution Form** — Submit resolution details (finder & owner roll numbers) in chat
- **Email Notifications** — Auto-notify all registered students when a new item is posted
- **Auto Archive** — Posts expire and archive after 7 days (cron job)
- **History** — Permanent record of all resolved and archived posts
- **Notification Panel** — In-app notification bell with unread count

## Tech Stack

### Backend
- **Node.js + Express** — REST API
- **MongoDB + Mongoose** — Database
- **Socket.IO** — Real-time messaging
- **JWT** — Authentication
- **Google Auth Library** — OAuth verification
- **Nodemailer** — Email notifications
- **Cloudinary** — Image uploads
- **node-cron** — Scheduled archive job

### Frontend
- **React 18** — UI
- **React Router v6** — Routing
- **Tailwind CSS** — Styling (dark theme)
- **Socket.IO Client** — Real-time
- **@react-oauth/google** — Google Sign-In
- **Axios** — HTTP requests
- **react-hot-toast** — Toast notifications
- **react-dropzone** — Drag-and-drop image upload
- **date-fns** — Date formatting
- **lucide-react** — Icons

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account
- Google Cloud Console project with OAuth credentials
- Gmail account (for email notifications)

---

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** or **Identity API**
4. Go to **Credentials** → Create **OAuth 2.0 Client ID**
5. Application type: **Web Application**
6. Add Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://your-domain.com`
7. Copy the **Client ID**

---

### 2. Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Copy Cloud Name, API Key, API Secret from dashboard

---

### 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nitj-lost-found
JWT_SECRET=your_random_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@nitj.ac.in
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:3000
ALLOWED_EMAIL_DOMAIN=nitj.ac.in
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → Generate

```bash
npm run dev
```

---

### 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

```bash
npm start
```

---

## Project Structure

```
nitj-lost-found/
├── backend/
│   ├── server.js              # Entry point
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Post.js            # Post model
│   │   ├── Message.js         # Chat message model
│   │   └── Notification.js    # Notification model
│   ├── routes/
│   │   ├── auth.js            # Auth route definitions
│   │   ├── posts.js           # Post route definitions
│   │   ├── chat.js            # Chat route definitions
│   │   ├── users.js           # User route definitions
│   │   └── notifications.js   # Notification route definitions
│   ├── controllers/
│   │   ├── authController.js         # Authentication, OTP & profile
│   │   ├── postController.js         # Post CRUD, archive & notify
│   │   ├── chatController.js         # Conversations & chat images
│   │   ├── userController.js         # User search & profiles
│   │   └── notificationController.js # Notification management
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── config/
│   │   └── cloudinary.js      # Upload config
│   └── utils/
│       ├── email.js           # Nodemailer & templates
│       └── socketHandlers.js  # Socket.IO events
│
└── frontend/
    ├── public/index.html
    └── src/
        ├── App.jsx             # Routes
        ├── index.js            # Entry
        ├── index.css           # Tailwind + custom styles
        ├── context/
        │   ├── AuthContext.jsx # Auth state
        │   └── SocketContext.jsx # Socket state
        ├── utils/
        │   └── api.js          # Axios instance
        ├── components/
        │   ├── layout/Layout.jsx      # Sidebar + navbar
        │   ├── posts/PostCard.jsx     # Post card UI
        │   ├── posts/ResolveModal.jsx # Resolve post modal
        │   ├── chat/ResolutionForm.jsx # Chat resolution form
        │   └── notifications/NotificationPanel.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── DashboardPage.jsx
            ├── PostsPage.jsx
            ├── CreatePostPage.jsx
            ├── PostDetailPage.jsx
            ├── ChatPage.jsx
            ├── HistoryPage.jsx
            └── ProfilePage.jsx
```

---

## Deployment

### Backend (Railway / Render / DigitalOcean)
1. Push code to GitHub
2. Connect to Railway or Render
3. Set all environment variables
4. Deploy

### Frontend (Vercel / Netlify)
1. `npm run build` in frontend folder
2. Deploy `build/` folder
3. Set `REACT_APP_API_URL` to your backend URL

### Update Google Console
Add your production domain to Authorized JavaScript Origins in Google Cloud Console.

---

## Security Features

- NITJ email domain enforcement (backend + frontend)
- JWT token authentication with 7-day expiry
- Rate limiting (1000 requests / 15 min per IP)
- File size limits (5MB per image)
- Only post authors can resolve/delete their posts

---

## Email Format Supported

- `adityakm.cs.23@nitj.ac.in`
- `rollno.branch.year@nitj.ac.in`
- Any `*@nitj.ac.in` address

---

Built with care for NIT Jalandhar
