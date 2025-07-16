import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";
import { dummyInterviews }  from "@/constants/index";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.action";

import HomePage from "@/components/HomePage";

async function Home() {
  const user = await getCurrentUser();

  // Debug logging
  console.log("Home page - User:", user ? { id: user.id, email: user.email } : "No user");

  // If user is authenticated, get their data
  let userInterviews = null;
  let allInterview = null;

  if (user && user.id) {
    [userInterviews, allInterview] = await Promise.all([
      getInterviewsByUserId(user.id),
      getLatestInterviews({ userId: user.id }),
    ]);
  }

  return <HomePage user={user} userInterviews={userInterviews} allInterview={allInterview} />;
}

export default Home;
