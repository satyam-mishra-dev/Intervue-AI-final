# VAPI Setup Guide - Fix Interview Generation Issues

## 🚨 Current Issue
The "Meeting ended due to ejection" errors and lack of interview generation are caused by missing VAPI configuration.

## 🔧 Required Setup

### 1. Create Environment File
Create a `.env.local` file in your project root with the following variables:

```env
# VAPI Configuration (REQUIRED for interview generation)
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_web_token_here
NEXT_PUBLIC_VAPI_WORKFLOW_ID=your_vapi_workflow_id_here

# Google AI (for question generation)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key_here

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (for server-side operations)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
```

### 2. Get VAPI Credentials

#### Step 1: Sign up for VAPI
1. Go to [https://vapi.ai](https://vapi.ai)
2. Create an account and verify your email

#### Step 2: Get Web Token
1. In your VAPI dashboard, go to **Settings** → **API Keys**
2. Copy your **Web Token** (starts with `sk-`)

#### Step 3: Create Workflow for Interview Generation
1. Go to **Workflows** in your VAPI dashboard
2. Click **Create New Workflow**
3. Name it "Interview Generator" or similar
4. Add the following configuration:

```javascript
// Workflow Configuration
{
  "name": "Interview Generator",
  "firstMessage": "Hello! I'm here to help you create a personalized interview. Let me ask you a few questions to understand your needs better.",
  "transcriber": {
    "provider": "deepgram",
    "model": "nova-2",
    "language": "en"
  },
  "voice": {
    "provider": "11labs",
    "voiceId": "sarah",
    "stability": 0.4,
    "similarityBoost": 0.8,
    "speed": 0.9,
    "style": 0.5,
    "useSpeakerBoost": true
  },
  "model": {
    "provider": "openai",
    "model": "gpt-4",
    "messages": [
      {
        "role": "system",
        "content": "You are an AI assistant helping users create personalized job interviews. Your goal is to gather information about the user's desired role, experience level, and technical skills to generate relevant interview questions.\n\nAsk the user about:\n1. What job role they're interviewing for\n2. Their experience level (Junior, Mid-level, Senior)\n3. The tech stack or skills required for the role\n4. Whether they prefer technical, behavioral, or mixed questions\n5. How many questions they want (typically 5-10)\n\nBe conversational and friendly. Once you have all the information, thank them and let them know their interview will be generated."
      }
    ]
  }
}
```

#### Step 4: Get Workflow ID
1. After creating the workflow, copy the **Workflow ID** from the URL or settings
2. It will look something like: `workflow_abc123...`

### 3. Test Configuration

Run the test script to verify your setup:

```bash
node test-vapi.js
```

You should see:
```
✅ VAPI Token configured: true
✅ Workflow ID configured: true
```

### 4. Restart Development Server

After adding the environment variables:

```bash
npm run dev
```

## 🎯 How Interview Generation Works Now

1. **User clicks "Call"** on the interview generation page
2. **VAPI workflow starts** and asks user about their interview preferences
3. **User provides details** about role, level, tech stack, etc.
4. **Call ends** and the conversation is analyzed
5. **Interview is generated** with personalized questions
6. **User is redirected** to see their new interview

## 🔍 Troubleshooting

### If you still get "Meeting ended due to ejection":
1. Check that your VAPI token is valid
2. Verify your workflow ID is correct
3. Ensure you have sufficient VAPI credits
4. Check your internet connection

### If interview generation fails:
1. Verify Google AI API key is set
2. Check Firebase configuration
3. Look at browser console for specific errors

### If webcam doesn't work:
1. Grant camera/microphone permissions
2. Check if another app is using the camera
3. Try refreshing the page

## 📞 Support

If you continue having issues:
1. Check the browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Test VAPI configuration with the provided test script
4. Ensure you have active VAPI and Google AI subscriptions 