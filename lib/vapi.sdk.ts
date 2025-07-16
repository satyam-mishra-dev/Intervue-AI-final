import Vapi from "@vapi-ai/web";

// Check if the token is available
const vapiToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

if (!vapiToken) {
  console.error("VAPI Web Token is not configured. Please add NEXT_PUBLIC_VAPI_WEB_TOKEN to your .env.local file");
}

// Create VAPI instance
export const vapi = new Vapi(vapiToken!);

// Add global error handler
vapi.on("error", (error: any) => {
  console.error("VAPI Error:", error);
});
