"use client";

import { useEffect } from "react";

export default function CookieClearer() {
  useEffect(() => {
    // Clear session cookies to fix Firebase project ID mismatch
    try {
      // Clear any existing session cookies
      document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      console.log("Session cookies cleared by CookieClearer");
    } catch (error) {
      console.log("Error clearing cookies:", error);
    }
  }, []);

  return null; // This component doesn't render anything
} 