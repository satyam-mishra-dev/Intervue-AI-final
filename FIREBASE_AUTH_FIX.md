# Firebase Authentication Fix Guide

## 🚨 Current Issues Fixed

1. **Project ID Mismatch**: Session cookie expects "intervue-7cf6d" but gets "intervue-ai-dce59"
2. **Credential Decoding Error**: Private key format issues
3. **Inconsistent Environment Variables**: Multiple naming conventions
4. **Session Cookie Issues**: Audience claim errors

## 🔧 What Was Fixed

### 1. Firebase Client Configuration (`firebase/client.ts`)
- ✅ Added proper error handling and logging
- ✅ Consistent environment variable naming
- ✅ Better validation for production vs development

### 2. Firebase Admin Configuration (`firebase/admin.ts`)
- ✅ Fixed credential parsing with multiple format support
- ✅ Proper private key formatting
- ✅ Support for both service account JSON and individual credentials
- ✅ Better error messages and logging

### 3. Authentication Actions (`lib/actions/auth.action.ts`)
- ✅ Fixed cookie API usage (async/await pattern)
- ✅ Improved error handling and logging
- ✅ Added session clearing utilities
- ✅ Fixed updateProfile method usage

### 4. Session Management (`lib/session-manager.ts`)
- ✅ Comprehensive session clearing utilities
- ✅ Client-side storage management
- ✅ Force reload capabilities

## 🛠️ Setup Instructions

### Step 1: Environment Variables

Create or update your `.env.local` file with the correct Firebase configuration:

```env
# Client Configuration (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Admin Configuration (Choose ONE option)

# Option 1: Service Account JSON (Recommended)
FIREBASE_SERVICE_ACCOUNT_KEY=base64_encoded_service_account_json

# OR Option 2: Individual Credentials
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
```

### Step 2: Get Firebase Credentials

#### For Client Configuration:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → General
4. Scroll down to "Your apps" section
5. Copy the configuration values

#### For Admin Configuration:
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. **Option 1**: Base64 encode the entire JSON and set as `FIREBASE_SERVICE_ACCOUNT_KEY`
5. **Option 2**: Extract individual values and set them separately

### Step 3: Clear Existing Sessions

Run this command to clear all existing sessions that might have the wrong project ID:

```bash
# If you have a script to clear sessions, run it
npm run clear-sessions

# Or manually clear browser storage and cookies
```

### Step 4: Verify Configuration

The system will now validate your configuration on startup. Check the console for any error messages.

## 🔍 Troubleshooting

### Project ID Mismatch Error
```
Session cookie project ID: Firebase session cookie has incorrect "aud" (audience) claim. 
Expected "intervue-7cf6d" but got "intervue-ai-dce59"
```

**Solution:**
1. Ensure `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and `FIREBASE_PROJECT_ID` are the same
2. Clear all sessions using the session manager
3. Restart the application

### Credential Decoding Error
```
Credential implementation provided to initializeApp() via the "credential" property 
failed to fetch a valid Google OAuth2 access token with the following error: "error:1E08010C:DECODER routines::unsupported"
```

**Solution:**
1. Check your private key format - it should start with `-----BEGIN PRIVATE KEY-----`
2. Ensure newlines are properly escaped as `\n`
3. Try using the service account JSON approach instead

### Missing Environment Variables
```
Missing required environment variable: NEXT_PUBLIC_FIREBASE_API_KEY
```

**Solution:**
1. Check your `.env.local` file exists in the project root
2. Ensure all required variables are set
3. Restart your development server after making changes

## 🧪 Testing the Fix

1. **Clear all sessions** using the session manager
2. **Restart your development server**
3. **Try signing up** with a new account
4. **Try signing in** with existing accounts
5. **Check the console** for any error messages

## 📝 Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | Firebase API key for client |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ | Firebase app ID |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | 🔄 | Base64 encoded service account JSON |
| `FIREBASE_PROJECT_ID` | 🔄 | Should match client project ID |
| `FIREBASE_CLIENT_EMAIL` | 🔄 | Service account email |
| `FIREBASE_PRIVATE_KEY` | 🔄 | Service account private key |

**Note:** Use either the service account key OR the individual credentials, not both.

## 🚀 Deployment Notes

For production deployment (Vercel, etc.):

1. Set all environment variables in your deployment platform
2. Ensure the project ID is consistent across all environments
3. Use the service account JSON approach for better security
4. Clear any existing sessions after deployment

## 📞 Support

If you're still experiencing issues:

1. Check the browser console for detailed error messages
2. Verify your Firebase project settings
3. Ensure all environment variables are correctly set
4. Try clearing all sessions and restarting the application 