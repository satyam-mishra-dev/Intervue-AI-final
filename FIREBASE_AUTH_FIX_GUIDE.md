# Firebase Authentication Fix Guide

## 🔍 Issue Analysis

Based on your error logs, you're experiencing a **credential decoding error**:

```
Credential implementation provided to initializeApp() via the "credential" property failed to fetch a valid Google OAuth2 access token with the following error: "error:1E08010C:DECODER routines::unsupported"
```

This error indicates that your Firebase private key is not in the correct format.

## 🛠️ Quick Fix Steps

### Step 1: Run the Private Key Fixer

```bash
node scripts/fix-private-key.js
```

This script will:
- Analyze your current private key format
- Fix common formatting issues
- Update your `.env.local` file automatically
- Create a backup of your original configuration

### Step 2: Debug Environment Variables

```bash
node scripts/debug-env.js
```

This will show you:
- Current Firebase configuration
- Project ID mismatches
- Missing environment variables
- Private key format analysis

### Step 3: Restart Your Server

After running the fix scripts, restart your development server:

```bash
npm run dev
```

## 🔧 Manual Fix Options

### Option 1: Fix Private Key Format

Your `FIREBASE_PRIVATE_KEY` in `.env.local` should look like this:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
```

**Common Issues:**
- Missing `\n` for line breaks
- Extra quotes around the key
- Base64 encoded instead of PEM format
- Wrong key format (RSA instead of standard)

### Option 2: Check Project ID Consistency

Ensure both client and admin use the same project ID:

```env
# Client (public)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=intervue-7cf6d

# Admin (server-side)
FIREBASE_PROJECT_ID=intervue-7cf6d
```

### Option 3: Verify Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`intervue-7cf6d`)
3. Go to Project Settings → Service Accounts
4. Generate a new private key
5. Copy the private key to your `.env.local`

## 📋 Required Environment Variables

Make sure your `.env.local` has all these variables:

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_CLIENT_ID=your_api_key
NEXT_PUBLIC_FIREBASE_CLIENT_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=intervue-7cf6d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin Configuration
FIREBASE_PROJECT_ID=intervue-7cf6d
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@intervue-7cf6d.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

## 🚨 Common Error Solutions

### Error: "DECODER routines::unsupported"
- **Cause**: Private key format is incorrect
- **Solution**: Run `node scripts/fix-private-key.js`

### Error: "Project ID mismatch"
- **Cause**: Client and admin using different projects
- **Solution**: Ensure `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and `FIREBASE_PROJECT_ID` are the same

### Error: "Missing required fields"
- **Cause**: Missing environment variables
- **Solution**: Check all required variables are set in `.env.local`

### Error: "Invalid service account"
- **Cause**: Service account credentials are incorrect
- **Solution**: Generate new service account key from Firebase Console

## 🔍 Debugging Commands

### Check Current Configuration
```bash
node scripts/debug-env.js
```

### Validate Private Key
```bash
node scripts/check-private-key.js
```

### Check Project Mismatch
```bash
node scripts/check-project-mismatch.js
```

### Fix Private Key Format
```bash
node scripts/fix-private-key.js
```

## 📞 Getting Help

If the automated fixes don't work:

1. **Check Firebase Console**: Ensure your project ID is correct
2. **Verify Service Account**: Generate a new private key
3. **Test Locally**: Try the authentication flow in development
4. **Check Logs**: Look for detailed error messages in the console

## 🎯 Success Indicators

After fixing, you should see:
- ✅ "Firebase Admin initialized successfully with project: intervue-7cf6d"
- ✅ No credential decoding errors
- ✅ Successful sign-in/sign-up flow
- ✅ Session cookies working properly

## 📝 Notes

- The Firebase Admin is currently using project `intervue-7cf6d`
- Make sure your client configuration matches this project ID
- Private keys must be in PEM format with proper line breaks
- Environment variables are case-sensitive
- Always restart your server after changing environment variables 