"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clientSessionUtils } from "@/lib/session-manager";

export default function GuestModeButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGuestMode = async () => {
    setIsLoading(true);
    
    try {
      // Clear any existing sessions first
      clientSessionUtils.clearAllSessions();
      
      // Set guest mode
      clientSessionUtils.setGuestMode();
      
      // Force a page reload to ensure the guest mode is properly detected
      window.location.href = "/";
    } catch (error) {
      console.error("Error setting guest mode:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGuestMode}
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? "Loading..." : "Continue as Guest"}
    </Button>
  );
} 