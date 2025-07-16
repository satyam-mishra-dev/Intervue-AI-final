import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "../../../../../lib/utils";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";

const InterviewDemoPage = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  // If no user, redirect to sign in
  if (!user) {
    redirect("/sign-in");
  }

  // Validate the ID parameter
  if (!id || id === 'demo' || id.trim() === '') {
    console.log("Invalid or demo ID, redirecting to interview/1...");
    redirect("/interview/1");
  }

  // Try to get the interview by ID
  let interview = await getInterviewById(id);

  // If interview not found, redirect to interview ID 1
  if (!interview) {
    console.log("Interview not found, redirecting to interview/1...");
    redirect("/interview/1");
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
          🎯 Interview Practice
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Practice with your generated interview questions. Good luck!
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
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
      {/* Removed demo-specific guidelines */}

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
      {/* Removed demo-specific footer note */}
    </div>
  );
};

export default InterviewDemoPage;
