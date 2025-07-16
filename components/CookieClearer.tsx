"use client";

import { useEffect } from "react";
import { clientSessionUtils } from "@/lib/session-manager";

export default function CookieClearer() {
  useEffect(() => {
    // Clear all session data to fix Firebase project ID mismatch
    try {
      clientSessionUtils.clearAllSessions();
      console.log("All sessions cleared by CookieClearer");
    } catch (error) {
      console.log("Error clearing sessions:", error);
    }
  }, []);

  return null; // This component doesn't render anything
} 