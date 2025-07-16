"use client";

import { useEffect } from "react";
import { sessionManager } from "@/lib/session-manager";

export default function SessionCleaner() {
  useEffect(() => {
    // Clear any invalid sessions on component mount
    sessionManager.clearInvalidSessions();
  }, []);

  return null; // This component doesn't render anything
} 