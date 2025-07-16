"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer, dummyInterviews } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import WebCamStream from "@/components/WebCamStream"; // ✅ Corrected import

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [vapiError, setVapiError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check VAPI configuration on component mount
  useEffect(() => {
    const checkVAPIConfig = () => {
      const vapiToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
      const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;
      
      if (!vapiToken || !workflowId) {
        setVapiError('VAPI is not configured. Please set up your environment variables. See VAPI_SETUP_GUIDE.md for instructions.');
        return false;
      }
      
      if (vapiToken === 'your_vapi_web_token_here' || workflowId === 'your_vapi_workflow_id_here') {
        setVapiError('VAPI credentials are not set. Please update your .env.local file with actual VAPI credentials.');
        return false;
      }
      
      return true;
    };
    
    if (!checkVAPIConfig()) {
      return;
    }
  }, []);

  useEffect(() => {
    // Check if we're in a browser environment and have mediaDevices support
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      setVapiError('Webcam access not available in this environment');
      return;
    }

    // Check if VAPI token is configured
    if (!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN) {
      setVapiError('VAPI token not configured. Please check your environment variables.');
      return;
    }

    const handleCallEvents = {
      onCallStart: () => {
        console.log("VAPI Call started");
        setCallStatus(CallStatus.ACTIVE);
        setVapiError(null);
      },
      onCallEnd: () => {
        console.log("VAPI Call ended");
        setCallStatus(CallStatus.FINISHED);
      },
      onMessage: (message: Message) => {
        if (message.type === "transcript" && message.transcriptType === "final") {
          setMessages((prev) => [...prev, { role: message.role, content: message.transcript }]);
        }
      },
      onSpeechStart: () => setIsSpeaking(true),
      onSpeechEnd: () => setIsSpeaking(false),
      onError: (error: Error) => {
        console.error("VAPI Error:", error);
        let errorMessage = error.message || 'Unknown VAPI error occurred';
        
        // Handle specific error types
        if (errorMessage.includes('ejection') || errorMessage.includes('Meeting ended due to ejection')) {
          errorMessage = 'Call was disconnected. This usually happens due to network issues or server problems.';
          setCallStatus(CallStatus.INACTIVE);
        } else if (errorMessage.includes('xhr poll error') || errorMessage.includes('network')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
          setCallStatus(CallStatus.INACTIVE);
        } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
          errorMessage = 'Camera or microphone access denied. Please grant permissions and try again.';
        } else if (errorMessage.includes('token') || errorMessage.includes('auth')) {
          errorMessage = 'Authentication error. Please check your VAPI configuration.';
        }
        
        setVapiError(errorMessage);
      },
    };

    vapi.on("call-start", handleCallEvents.onCallStart);
    vapi.on("call-end", handleCallEvents.onCallEnd);
    vapi.on("message", handleCallEvents.onMessage);
    vapi.on("speech-start", handleCallEvents.onSpeechStart);
    vapi.on("speech-end", handleCallEvents.onSpeechEnd);
    vapi.on("error", handleCallEvents.onError);

    setIsInitialized(true);

    return () => {
      vapi.off("call-start", handleCallEvents.onCallStart);
      vapi.off("call-end", handleCallEvents.onCallEnd);
      vapi.off("message", handleCallEvents.onMessage);
      vapi.off("speech-start", handleCallEvents.onSpeechStart);
      vapi.off("speech-end", handleCallEvents.onSpeechEnd);
      vapi.off("error", handleCallEvents.onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) setLastMessage(messages[messages.length - 1].content);

    const handleGenerateFeedback = async () => {
      try {
        // Check if we have a valid interview ID
        if (!interviewId) {
          console.log("⚠️ No interview ID found, using demo interview for feedback");
          await handleFallbackToDemoInterview();
          return;
        }

        const { success, feedbackId: id } = await createFeedback({
          interviewId: interviewId,
          userId: userId!,
          transcript: messages,
          feedbackId,
        });

        if (success && id) {
          router.push(`/interview/${interviewId}/feedback`);
        } else {
          console.error("Error saving feedback, trying demo fallback");
          // If feedback generation fails, try demo fallback
          await handleFallbackToDemoInterview();
        }
      } catch (error: any) {
        console.error("Feedback generation failed:", error);
        // If any error occurs, try demo fallback
        await handleFallbackToDemoInterview();
      }
    };

    const handleGenerateInterview = async () => {
      try {
        console.log("🔄 Generating interview from conversation...");
        
        // Create a more intelligent interview generation by analyzing the conversation
        const conversationText = messages
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        
        // Extract interview details from the conversation using AI
        const interviewData = {
          type: "Mixed", // Default type - could be extracted from conversation
          role: "Software Developer", // Default role - could be extracted from conversation  
          level: "Junior", // Default level - could be extracted from conversation
          techstack: "JavaScript, React, Node.js", // Default tech stack - could be extracted from conversation
          amount: 5, // Default number of questions
          userid: userId,
          conversation: conversationText, // Include conversation for context
        };

        const response = await fetch("/api/vapi/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(interviewData),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate interview: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log("✅ Interview generated successfully");
          // Show success message before navigating
          alert("Interview generated successfully! Redirecting to your interviews...");
          // Navigate to the home page to see the new interview
          router.push("/");
        } else {
          console.error("❌ Interview generation failed:", data.error);
          // Fallback to demo interview for feedback
          await handleFallbackToDemoInterview();
        }
      } catch (error: any) {
        console.error("❌ Interview generation error:", error);
        // Fallback to demo interview for feedback
        await handleFallbackToDemoInterview();
      }
    };

    const handleFallbackToDemoInterview = async () => {
      try {
        console.log("🔄 Using demo interview for feedback generation...");
        
        // Try to extract some context from the conversation
        const conversationText = messages.map(msg => msg.content).join(' ');
        let extractedRole = "Software Developer";
        let extractedLevel = "Junior";
        let extractedTech = ["JavaScript", "React", "Node.js"];
        
        // Simple keyword extraction from conversation
        if (conversationText.toLowerCase().includes('frontend') || conversationText.toLowerCase().includes('react')) {
          extractedRole = "Frontend Developer";
          extractedTech = ["React", "JavaScript", "HTML", "CSS"];
        } else if (conversationText.toLowerCase().includes('backend') || conversationText.toLowerCase().includes('node')) {
          extractedRole = "Backend Developer";
          extractedTech = ["Node.js", "JavaScript", "Express", "MongoDB"];
        } else if (conversationText.toLowerCase().includes('full stack') || conversationText.toLowerCase().includes('fullstack')) {
          extractedRole = "Full Stack Developer";
          extractedTech = ["React", "Node.js", "JavaScript", "MongoDB"];
        }
        
        if (conversationText.toLowerCase().includes('senior') || conversationText.toLowerCase().includes('experienced')) {
          extractedLevel = "Senior";
        } else if (conversationText.toLowerCase().includes('mid') || conversationText.toLowerCase().includes('intermediate')) {
          extractedLevel = "Mid-level";
        }
        
        // Generate appropriate questions based on the extracted role
        const getQuestionsForRole = (role: string, level: string) => {
          const baseQuestions = [
            "Tell me about your background and experience",
            "What motivates you in your work?",
            "How do you handle challenges and setbacks?",
            "Describe a project you're particularly proud of",
            "How do you stay updated with industry trends?"
          ];
          
          const technicalQuestions = {
            "Frontend Developer": [
              "How do you approach responsive design?",
              "What's your experience with modern JavaScript frameworks?",
              "How do you optimize frontend performance?",
              "Describe your CSS architecture approach",
              "How do you handle cross-browser compatibility?"
            ],
            "Backend Developer": [
              "How do you design scalable APIs?",
              "What's your experience with databases?",
              "How do you handle security in your applications?",
              "Describe your testing strategy",
              "How do you monitor and debug production issues?"
            ],
            "Full Stack Developer": [
              "How do you coordinate between frontend and backend?",
              "What's your deployment strategy?",
              "How do you handle data flow between client and server?",
              "Describe your full-stack architecture decisions",
              "How do you ensure consistency across the stack?"
            ],
            "Software Developer": [
              "What programming languages are you most comfortable with?",
              "How do you approach problem-solving?",
              "Describe your development workflow",
              "How do you collaborate with team members?",
              "What's your experience with version control?"
            ]
          };
          
          const roleQuestions = technicalQuestions[role as keyof typeof technicalQuestions] || technicalQuestions["Software Developer"];
          
          // Mix behavioral and technical questions
          return [...baseQuestions.slice(0, 3), ...roleQuestions.slice(0, 2)];
        };

        // Get a random demo interview as fallback
        const getRandomDemoInterview = () => {
          const randomIndex = Math.floor(Math.random() * dummyInterviews.length);
          const demo = dummyInterviews[randomIndex];
          return {
            ...demo,
            id: `demo-${Date.now()}-${randomIndex}`,
            userId: userId,
            finalized: true,
            createdAt: new Date().toISOString(),
          };
        };
        
        // Create a demo interview using extracted data or fallback to random demo
        const demoInterview = conversationText.length > 10 ? {
          id: `demo-${Date.now()}`, // Generate a unique demo ID
          userId: userId,
          role: extractedRole,
          type: "Mixed",
          techstack: extractedTech,
          level: extractedLevel,
          questions: getQuestionsForRole(extractedRole, extractedLevel),
          finalized: true,
          coverImage: "/covers/facebook.png",
          createdAt: new Date().toISOString(),
        } : getRandomDemoInterview();

        // Save the demo interview to Firebase
        const saveResponse = await fetch("/api/save-demo-interview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(demoInterview),
        });

        if (saveResponse.ok) {
          const saveData = await saveResponse.json();
          if (saveData.success) {
            console.log("✅ Demo interview saved successfully");
            
            // Generate feedback using the demo interview
            const { success, feedbackId: id } = await createFeedback({
              interviewId: saveData.interviewId,
              userId: userId!,
              transcript: messages,
              feedbackId,
            });

            if (success && id) {
              const roleText = conversationText.length > 10 ? `${extractedLevel} ${extractedRole}` : "practice";
              alert(`Interview generation failed, but we've created a ${roleText} demo interview for you to practice with! Redirecting to feedback...`);
              router.push(`/interview/${saveData.interviewId}/feedback`);
            } else {
              console.error("Error generating feedback for demo interview");
              alert("We couldn't generate feedback. Please try again later.");
              router.push("/");
            }
          } else {
            throw new Error("Failed to save demo interview");
          }
        } else {
          throw new Error("Failed to save demo interview");
        }
      } catch (error: any) {
        console.error("❌ Demo interview fallback failed:", error);
        alert("We couldn't generate an interview or feedback. Please try again later.");
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        handleGenerateInterview();
      } else {
      handleGenerateFeedback();
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    if (vapiError) {
      alert('Please resolve the VAPI error and try again');
      return;
    }

    if (!isInitialized) {
      alert('VAPI is not initialized. Please wait a moment and try again.');
      return;
    }

    setCallStatus(CallStatus.CONNECTING);
    setVapiError(null);
  
    try {
      // Call the API to start the Python script
      const response = await fetch("/api/start-python/", { method: "POST" });
  
      if (!response.ok) {
        throw new Error(`Failed to start Python script: ${response.statusText}`);
      }
  
      const data = await response.json();
      if (!data.success) {
        throw new Error(`Python script error: ${data.error || "Unknown error"}`);
      }
  
      console.log("✅ Python script started successfully.");
    } catch (error: any) {
      console.error("❌ Error starting Python script:", error);
    }
  
    try {
      // Start VAPI process with better error handling
      if (type === "generate") {
        await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
          variableValues: { username: userName, userid: userId },
        });
      } else {
        const formattedQuestions = questions?.map((q) => `- ${q}`).join("\n") || "";
        await vapi.start(interviewer, { variableValues: { questions: formattedQuestions } });
      }
    } catch (error: any) {
      console.error("❌ Error starting VAPI:", error);
      const errorMessage = error.message || 'Failed to start VAPI call';
      setVapiError(errorMessage);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = async () => {
    setCallStatus(CallStatus.FINISHED);
  
    try {
      // Stop the Python script with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
  
      const response = await fetch("/api/stop-python/", { 
        method: "POST",
        signal: controller.signal
      });
  
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        throw new Error(`Failed to stop Python script: ${response.statusText}`);
      }
  
      const data = await response.json();
      if (!data.success) {
        throw new Error(`Python script stop error: ${data.error || "Unknown error"}`);
      }
  
      console.log("✅ Python script stopped successfully.");
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.error("❌ Error: Python script stop request timed out.");
      } else {
        console.error("❌ Error stopping Python script:", error);
      }
    }
  
    try {
      vapi.stop(); // Stop the call
      console.log("✅ Call disconnected successfully.");
    } catch (error: any) {
      console.error("❌ Error disconnecting call:", error);
    }
  };

  const retryConnection = () => {
    setVapiError(null);
    setCallStatus(CallStatus.INACTIVE);
    setMessages([]);
    setLastMessage("");
  };

  const handleRetryWithNewCall = async () => {
    setVapiError(null);
    setCallStatus(CallStatus.INACTIVE);
    setMessages([]);
    setLastMessage("");
    
    // Wait a moment before trying again
    setTimeout(() => {
      handleCall();
    }, 1000);
  };
  
  
  
  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image src="/ai-avatar.png" alt="AI Interviewer" width={65} height={54} className="object-cover" />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card with Live Webcam Stream */}
        <div className="card-border">
          <div className="card-content">
            <WebCamStream /> {/* ✅ Live Video Feed Instead of Static Image */}
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p className="animate-fadeIn opacity-100">{lastMessage}</p>
          </div>
        </div>
      )}

      {/* VAPI Error Display */}
      {vapiError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">VAPI Error:</p>
          <p className="text-sm">{vapiError}</p>
          {vapiError.includes('not configured') || vapiError.includes('not set') ? (
            <div className="mt-2">
              <p className="text-sm font-semibold">Quick Fix:</p>
              <ol className="text-sm mt-1 ml-4 list-decimal">
                <li>Get VAPI credentials from <a href="https://vapi.ai" target="_blank" rel="noopener noreferrer" className="underline">vapi.ai</a></li>
                <li>Update your <code className="bg-gray-200 px-1 rounded">.env.local</code> file</li>
                <li>Restart your development server</li>
              </ol>
              <p className="text-sm mt-2">
                📖 See <code className="bg-gray-200 px-1 rounded">VAPI_SETUP_GUIDE.md</code> for detailed instructions
              </p>
            </div>
          ) : (
            <p className="text-sm mt-2">
              Please ensure you have granted camera and microphone permissions to this site.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button 
              onClick={retryConnection}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Clear Error
            </button>
            {!vapiError.includes('not configured') && !vapiError.includes('not set') && (
              <button 
                onClick={handleRetryWithNewCall}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                Retry Call
              </button>
            )}
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== CallStatus.ACTIVE ? (
          <button 
            className="btn-call" 
            onClick={handleCall}
            disabled={!!vapiError || !isInitialized}
          >
            {callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED ? "Call" : ". . ."}
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
