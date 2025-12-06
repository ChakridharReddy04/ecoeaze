# 🌱 EcoEaze - Smart Sustainable Farming Platform

A full-stack web application connecting farmers directly with consumers for fresh, sustainable agriculture.

## ✨ Key Features

- 🏪 **Direct Farmer-Consumer Marketplace** - Buy fresh produce directly from farmers
- 📦 **Smart Order Management** - Real-time order tracking with status updates
- 📧 **OTP Email Authentication** - Secure login with email verification
- 🔔 **Automated Notifications** - Order confirmations and delivery updates via email
- 📱 **Responsive Design** - Seamless experience on desktop, tablet, and mobile
- 💾 **Real-time Caching** - Redis-based caching for fast performance
- 💳 **Payment Integration** - Razorpay & Stripe support
- 💬 **WhatsApp Integration** - Twilio-based customer support
- 📊 **Analytics Dashboard** - Order and sales insights

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - REST API framework
- **MongoDB** - NoSQL database
- **Redis** - Caching & message broker
- **Nodemailer** - Email service with OTP support
- **Celery** - Python task queue

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client

## 📋 Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local or Atlas)
- **Redis** (local or cloud)
- **Git**
- **npm** or **bun**

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/ChakridharReddy04/ecoeaze.git
cd ecoeaze
```

### 2. Backend Setup

```bash
cd ecoeaze-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Add your Gmail credentials, API keys, database URLs, etc.

# Start backend server
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ecoeaze-frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

Frontend runs on `http://localhost:8081`

## 🔑 Environment Setup

### Required Services

1. **MongoDB**
   - Local: `mongodb://localhost:27017/ecoeaze`
   - Or use MongoDB Atlas: Create free cluster at https://www.mongodb.com/cloud/atlas

2. **Redis**
   - Local: `localhost:6379`
   - Or use Redis Cloud: https://redis.com/cloud/

3. **Email (Gmail)**
   - Enable 2-Step Verification: https://myaccount.google.com/security
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Add to `.env` as `EMAIL_PASSWORD`

4. **Cloudinary** (Optional - for image uploads)
   - Sign up: https://cloudinary.com
   - Get API credentials and add to `.env`

## 📚 Project Structure

```
ecoeaze/
├── ecoeaze-backend/           # Node.js backend
│   ├── src/
│   │   ├── app.js            # Express app setup
│   │   ├── server.js         # Server entry point
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Route handlers
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Custom middleware
│   │   └── utils/            # Utility functions
│   ├── celery/               # Python Celery tasks
│   ├── package.json
│   └── README.md
│
├── ecoeaze-frontend/          # React frontend
│   ├── src/
│   │   ├── App.tsx           # Main component
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API services
│   │   ├── hooks/            # Custom hooks
│   │   ├── context/          # React context
│   │   └── assets/           # Images & icons
│   ├── package.json
│   └── README.md
│
├── .gitignore
├── .env.example              # Environment template
└── README.md                 # This file
```

## 🔐 Security Notes

- **Never commit `.env` file** - it contains sensitive credentials
- Always use `.env.example` as template
- Keep `JWT_SECRET` keys strong and unique
- Rotate API keys regularly
- Use HTTPS in production

## 📖 API Documentation

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Send OTP to email
- `POST /auth/verify-otp` - Verify OTP and get JWT
- `POST /auth/resend-otp` - Resend OTP code
- `POST /auth/logout` - Logout user

### Products
- `GET /products` - Get all products with filters
- `GET /products/:id` - Get single product
- `POST /products` - Create product (admin)
- `PUT /products/:id` - Update product (admin)
- `DELETE /products/:id` - Delete product (admin)

### Orders
- `POST /orders` - Create new order
- `GET /orders` - Get user's orders
- `GET /orders/:id` - Get order details
- `PUT /orders/:id/status` - Update order status (admin)

## 🧪 Testing

```bash
# Backend tests
cd ecoeaze-backend
npm run test

# Test OTP email
npm run test:otp

# Test login flow
npm run test:login

# Test registration
npm run test:registration
```

## 📦 Deployment

### Deploy Backend

**Option 1: Railway**
1. Connect GitHub to Railway
2. Select this repository
3. Add environment variables
4. Deploy!

**Option 2: Heroku**
```bash
# Install Heroku CLI
npm install -g heroku

# Login and deploy
heroku login
heroku create your-app-name
git push heroku main
```

### Deploy Frontend

**Option 1: Vercel**
1. Go to https://vercel.com
2. Import repository
3. Deploy!

**Option 2: Netlify**
1. Connect GitHub
2. Set build command: `npm run build`
3. Deploy!

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📞 Support & Issues

Found a bug? Have a question?
- Open an issue: https://github.com/ChakridharReddy04/ecoeaze/issues
- Email: chakridhar9515@gmail.com

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- MongoDB for excellent database
- Nodemailer for email delivery
- Cloudinary for image hosting
- Twilio for WhatsApp integration
- The open-source community

---

**Made with 💚 by Chakridhar Reddy**

Last Updated: December 2025
