// Simple VAPI configuration test
console.log('🔧 Testing VAPI Configuration...');
console.log('================================');

// Check environment variables
const vapiToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;

console.log('VAPI Token configured:', !!vapiToken);
console.log('Workflow ID configured:', !!workflowId);

if (!vapiToken) {
  console.error('❌ NEXT_PUBLIC_VAPI_WEB_TOKEN is not set');
  console.log('Please add it to your .env.local file');
} else {
  console.log('✅ VAPI Token is configured');
}

if (!workflowId) {
  console.error('❌ NEXT_PUBLIC_VAPI_WORKFLOW_ID is not set');
  console.log('Please add it to your .env.local file');
} else {
  console.log('✅ Workflow ID is configured');
}

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('✅ Running in browser environment');
  
  // Check for mediaDevices
  if (navigator.mediaDevices) {
    console.log('✅ MediaDevices API available');
  } else {
    console.error('❌ MediaDevices API not available');
  }
  
  // Check for getUserMedia
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log('✅ getUserMedia available');
  } else {
    console.error('❌ getUserMedia not available');
  }
} else {
  console.log('ℹ️  Not in browser environment (server-side)');
}

console.log('================================');
console.log('If you see any ❌ errors above, please fix them before testing VAPI.'); 