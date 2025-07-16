import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";

import {
  getFeedbackByInterviewId,
  getInterviewById,
  createDemoInterview,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";

// Demo interview data for fallback
const demoInterviewData = {
  role: "Software Developer",
  type: "Mixed",
  level: "Junior",
  techstack: ["JavaScript", "React", "Node.js", "TypeScript"],
  questions: [
    "Tell me about your background and experience in software development",
    "What programming languages are you most comfortable with?",
    "How do you approach problem-solving when you encounter a bug?",
    "Describe a project you're particularly proud of and what you learned from it",
    "How do you stay updated with new technologies and industry trends?",
    "What's your experience with version control systems like Git?",
    "How do you handle working in a team environment?",
    "What's your approach to testing and debugging code?",
    "Tell me about a challenging technical problem you solved recently",
    "How do you prioritize tasks when working on multiple projects?"
  ],
  coverImage: "/covers/facebook.png"
};

const InterviewDemoPage = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  // If no user, redirect to sign in
  if (!user) {
    redirect("/sign-in");
  }

  // Try to get the interview by ID
  let interview = await getInterviewById(id);
  let isDemoMode = false;

  // If interview not found, create a demo interview and redirect
  if (!interview) {
    console.log("Interview not found, creating demo interview...");
    console.log("User ID:", user.id);
    
    // Create a demo interview using server action
    try {
      const saveResponse = await createDemoInterview(user.id);
      console.log("Save response:", saveResponse);

      if (saveResponse.success) {
        console.log("Redirecting to:", `/interview/${saveResponse.interviewId}/demo`);
        // Redirect to the demo interview with the new ID
        redirect(`/interview/${saveResponse.interviewId}/demo`);
      } else {
        console.log("Failed to save demo interview:", saveResponse.error);
      }
    } catch (error) {
      console.error("Failed to create demo interview:", error);
    }

    // If saving fails, use the demo data directly
    interview = {
      id: `demo-${Date.now()}`,
      userId: user.id,
      role: demoInterviewData.role,
      type: demoInterviewData.type,
      techstack: demoInterviewData.techstack,
      level: demoInterviewData.level,
      questions: demoInterviewData.questions,
      finalized: true,
      coverImage: demoInterviewData.coverImage,
      createdAt: new Date().toISOString(),
    } as any;
    isDemoMode = true;
  }

  // Ensure interview is defined
  if (!interview) {
    redirect("/interview");
  }

  // Get feedback if it exists
  const feedback = await getFeedbackByInterviewId({
    interviewId: interview.id,
    userId: user.id,
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isDemoMode ? "🧪 Demo Interview Practice" : "🎯 Interview Practice"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {isDemoMode 
            ? "Practice your interview skills with our AI interviewer. This is a safe space to improve your responses!"
            : "Practice with your generated interview questions. Good luck!"
          }
        </p>
      </div>

      {/* Interview Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-row gap-4 justify-between items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center max-sm:flex-col">
            <div className="flex flex-row gap-4 items-center">
              <Image
                src={(interview as any).coverImage || getRandomInterviewCover()}
                alt="interview-cover"
                width={50}
                height={50}
                className="rounded-full object-cover size-[50px]"
              />
              <div>
                <h3 className="text-xl font-semibold capitalize text-gray-900 dark:text-white">
                  {interview.role} Interview
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Level: {interview.level} • Type: {interview.type}
                  {isDemoMode && " • Demo Mode"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDemoMode && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                Practice Mode
              </span>
            )}
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
              {interview.type}
            </span>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Focus Areas:
          </p>
          <div className="flex flex-wrap gap-2">
            {interview.techstack.map((tech: string, index: number) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Interview Guidelines - Only show for demo mode */}
      {isDemoMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-8">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📋 Interview Guidelines
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Speak clearly and at a moderate pace</li>
            <li>• Provide specific examples from your experience</li>
            <li>• Be honest about your knowledge level</li>
            <li>• Ask for clarification if needed</li>
            <li>• This is practice - don't worry about being perfect!</li>
          </ul>
        </div>
      )}

      {/* Interview Component */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <Agent
          userName={user?.name!}
          userId={user?.id}
          interviewId={interview.id}
          type="interview"
          questions={interview.questions}
          feedbackId={feedback?.id}
        />
      </div>

      {/* Footer Note - Only show for demo mode */}
      {isDemoMode && (
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>
            💡 This is a practice interview. Your responses will be analyzed for feedback, 
            but no data will be permanently stored.
          </p>
        </div>
      )}
    </div>
  );
};

export default InterviewDemoPage;
