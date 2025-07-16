"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";
import { dummyInterviews } from "@/constants";
import { useGuestMode } from "./GuestModeProvider";
import GuestModeButton from "./GuestModeButton";

interface HomePageProps {
  user: any;
  userInterviews: any;
  allInterview: any;
}

export default function HomePage({ user, userInterviews, allInterview }: HomePageProps) {
  const { isGuestMode, setGuestMode } = useGuestMode();

  const handleSignOut = () => {
    if (isGuestMode) {
      setGuestMode(false);
      window.location.href = "/";
    }
  };

  // If no user and not in guest mode, show sign-in prompt
  if (!user && !isGuestMode) {
    return (
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          <div className="flex flex-col gap-3">
            <Button asChild className="btn-primary max-sm:w-full">
              <Link href="/sign-in">Sign In to Start</Link>
            </Button>
            <GuestModeButton />
          </div>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>
    );
  }

  // Use guest data if in guest mode, otherwise use real user data
  const currentUser = isGuestMode ? { id: "guest", name: "Guest User" } : user;
  const currentUserInterviews = isGuestMode ? dummyInterviews : (userInterviews || []);
  const currentAllInterview = isGuestMode ? dummyInterviews : (allInterview || []);

  const hasPastInterviews = currentUserInterviews?.length! > 0;
  const hasUpcomingInterviews = currentAllInterview?.length! > 0;

  return (
    <>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          {isGuestMode && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p className="text-sm">
                <strong>Guest Mode:</strong> You're exploring the app as a guest. 
                <button 
                  onClick={handleSignOut}
                  className="underline ml-1 hover:no-underline"
                >
                  Sign in to save your progress
                </button>
              </p>
            </div>
          )}

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interviews</h2>

        <div className="interviews-section">
          {hasPastInterviews ? (
            currentUserInterviews?.map((interview: any) => (
              <InterviewCard
                key={interview.id}
                userId={currentUser?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            dummyInterviews?.map((interview: any) => (
              <InterviewCard
                key={interview.id}
                userId={currentUser?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Take Interviews</h2>

        <div className="interviews-section">
          {hasUpcomingInterviews ? (
            currentAllInterview?.map((interview: any) => (
              <InterviewCard
                key={interview.id}
                userId={currentUser?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            dummyInterviews?.map((interview: any) => (
              <InterviewCard
                key={interview.id}
                userId={currentUser?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          )}
        </div>
      </section>
    </>
  );
} 