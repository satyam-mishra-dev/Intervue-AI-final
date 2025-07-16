"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  // Validate the ID parameter
  if (!id || typeof id !== 'string' || id.trim() === '') {
    console.log("Invalid interview ID:", id);
    return null;
  }

  try {
    const interview = await db.collection("interviews").doc(id).get();
    return interview.data() as Interview | null;
  } catch (error) {
    console.error("Error fetching interview:", error);
    return null;
  }
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  // Validate the parameters
  if (!interviewId || !userId || typeof interviewId !== 'string' || interviewId.trim() === '') {
    console.log("Invalid parameters for getFeedbackByInterviewId:", { interviewId, userId });
    return null;
  }

  try {
    const querySnapshot = await db
      .collection("feedback")
      .where("interviewId", "==", interviewId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (querySnapshot.empty) return null;

    const feedbackDoc = querySnapshot.docs[0];
    return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return null;
  }
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  // Validate userId to prevent undefined values in Firestore queries
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    console.log("Invalid userId for getLatestInterviews:", userId);
    return [];
  }

  try {
    const interviews = await db
      .collection("interviews")
      .orderBy("createdAt", "desc")
      .where("finalized", "==", true)
      .where("userId", "!=", userId)
      .limit(limit)
      .get();

    return interviews.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Interview[];
  } catch (error) {
    console.error("Error fetching latest interviews:", error);
    return [];
  }
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  // Validate userId to prevent undefined values in Firestore queries
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    console.log("Invalid userId for getInterviewsByUserId:", userId);
    return [];
  }

  try {
    const interviews = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return interviews.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Interview[];
  } catch (error) {
    console.error("Error fetching interviews by user ID:", error);
    return [];
  }
}

export async function createDemoInterview(userId: string) {
  try {
    const demoInterview = {
      userId: userId,
      role: "Software Developer",
      type: "Mixed",
      techstack: ["JavaScript", "React", "Node.js", "TypeScript"],
      level: "Junior",
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
      finalized: true,
      coverImage: "/covers/facebook.png",
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("interviews").add(demoInterview);
    
    return { 
      success: true, 
      interviewId: docRef.id,
      interview: { id: docRef.id, ...demoInterview }
    };
  } catch (error: any) {
    console.error("Error creating demo interview:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}
