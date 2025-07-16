"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function GuestModeButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGuestMode = async () => {
    setIsLoading(true);
    
    // Set a guest mode flag in localStorage
    localStorage.setItem("guestMode", "true");
    
    // Force a page reload to ensure the guest mode is properly detected
    window.location.href = "/";
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