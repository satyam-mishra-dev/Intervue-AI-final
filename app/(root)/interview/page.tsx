import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";
import Link from "next/link";

const Page = async () => {
  const user = await getCurrentUser();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🎯 Interview Preparation
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Choose your interview experience - generate a personalized interview or practice with our demo
        </p>
      </div>

      {/* Options Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Generate Interview Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Generate Custom Interview
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create a personalized interview based on your preferences and experience level
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              <p>• AI-powered interview generation</p>
              <p>• Role-specific questions</p>
              <p>• Personalized feedback</p>
            </div>
          </div>
        </div>

        {/* Demo Practice Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🧪</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Practice Demo Interview
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Practice with a pre-built interview to improve your skills
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              <p>• Ready-to-use questions</p>
              <p>• Safe practice environment</p>
              <p>• Instant feedback</p>
            </div>
            <Link 
              href="/interview/demo/demo"
              className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Start Practice
            </Link>
          </div>
        </div>
      </div>

      {/* Generate Interview Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Generate Your Interview
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Click the call button below to start generating your personalized interview
          </p>
        </div>
        
        <Agent
          userName={user?.name!}
          userId={user?.id}
          type="generate"
        />
      </div>
    </div>
  );
};

export default Page;
