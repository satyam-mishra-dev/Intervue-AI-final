"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGuestMode } from "./GuestModeProvider";

interface GuestModeBypassProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

export default function GuestModeBypass({ children, isAuthenticated }: GuestModeBypassProps) {
  const { isGuestMode } = useGuestMode();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is authenticated or in guest mode
    const guestModeEnabled = localStorage.getItem("guestMode") === "true";
    
    // Allow access if authenticated, in guest mode, or if authentication check failed
    if (isAuthenticated || guestModeEnabled) {
      setShouldRender(true);
    } else {
      // Only redirect if we're sure the user is not authenticated and not in guest mode
      // Add a small delay to allow guest mode to be set
      const timeoutId = setTimeout(() => {
        const guestModeEnabled = localStorage.getItem("guestMode") === "true";
        if (!guestModeEnabled) {
          router.push("/sign-in");
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
    setIsChecking(false);
  }, [isAuthenticated, isGuestMode, router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!shouldRender) {
    return null; // Don't render anything while checking
  }

  return <>{children}</>;
} 