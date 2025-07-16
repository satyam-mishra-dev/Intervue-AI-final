"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGuestMode } from "./GuestModeProvider";
import { clientSessionUtils } from "@/lib/session-manager";

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
    const checkAccess = () => {
      // Check if user is authenticated or in guest mode
      const guestModeEnabled = clientSessionUtils.isGuestMode();
      
      console.log("GuestModeBypass - isAuthenticated:", isAuthenticated);
      console.log("GuestModeBypass - isGuestMode:", isGuestMode);
      console.log("GuestModeBypass - guestModeEnabled:", guestModeEnabled);
      
      // Allow access if authenticated, in guest mode, or if authentication check failed
      if (isAuthenticated || guestModeEnabled) {
        console.log("GuestModeBypass - Access granted");
        setShouldRender(true);
        setIsChecking(false);
      } else {
        console.log("GuestModeBypass - Access denied, redirecting to sign-in");
        router.push("/sign-in");
      }
    };

    // Add a small delay to ensure all state is properly initialized
    const timeoutId = setTimeout(checkAccess, 50);
    
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, isGuestMode, router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!shouldRender) {
    return null; // Don't render anything while checking
  }

  return <>{children}</>;
} 