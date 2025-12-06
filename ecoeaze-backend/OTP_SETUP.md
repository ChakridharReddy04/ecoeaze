# OTP Email Login Setup

## Overview
Users now verify their login with a 6-digit OTP sent to their email via Gmail SMTP.

## Setup Steps

### 1. Enable 2-Step Verification on Your Gmail Account
- Go to: https://myaccount.google.com/security
- Find "2-Step Verification" and click it
- Follow the prompts to enable it

### 2. Generate Google App Password
- After 2-Step is enabled, go to: https://myaccount.google.com/apppasswords
- Select: **Mail** and **Windows Computer** (or your device)
- Click **Generate**
- Copy the 16-character password (remove spaces)

### 3. Update .env File
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
OTP_EXPIRY_SECONDS=600
OTP_MAX_ATTEMPTS=3
```

### 4. Test Email Connection
```bash
npm run test:otp
```

## API Endpoints

### 1. Login - Generate OTP
**POST** `/auth/login`
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email. Verify with /auth/verify-otp",
  "userId": "user-id",
  "email": "user@example.com"
}
```

### 2. Verify OTP
**POST** `/auth/verify-otp`
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "customer"
  },
  "accessToken": "jwt-token"
}
```

### 3. Resend OTP
**POST** `/auth/resend-otp`
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP resent to your email"
}
```

## Features
- ✅ 6-digit OTP generation
- ✅ OTP expires after 10 minutes
- ✅ Max 3 incorrect attempts
- ✅ Beautiful HTML email template
- ✅ Gmail SMTP integration
- ✅ SHA256 OTP hashing for security
- ✅ Development mode logs OTP to console

## Development Mode
In development, OTPs are logged to console:
```
[DEV] OTP for user@example.com: 123456
```

## Security Notes
- Never commit .env with real credentials
- Use App Passwords, not Gmail password
- OTPs are hashed with SHA256 before storage
- Max 3 attempts to prevent brute force
- OTPs auto-delete after expiration
