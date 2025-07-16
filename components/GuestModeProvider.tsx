"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface GuestUser {
  id: "guest";
  name: "Guest User";
  email: "guest@example.com";
}

interface GuestModeContextType {
  isGuestMode: boolean;
  guestUser: GuestUser | null;
  setGuestMode: (enabled: boolean) => void;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

export function GuestModeProvider({ children }: { children: React.ReactNode }) {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);

  useEffect(() => {
    // Check if guest mode is enabled in localStorage
    const guestMode = localStorage.getItem("guestMode") === "true";
    setIsGuestMode(guestMode);
    
    if (guestMode) {
      setGuestUser({
        id: "guest",
        name: "Guest User",
        email: "guest@example.com",
      });
    }
  }, []);

  const setGuestMode = (enabled: boolean) => {
    setIsGuestMode(enabled);
    if (enabled) {
      localStorage.setItem("guestMode", "true");
      setGuestUser({
        id: "guest",
        name: "Guest User",
        email: "guest@example.com",
      });
    } else {
      localStorage.removeItem("guestMode");
      setGuestUser(null);
    }
  };

  return (
    <GuestModeContext.Provider value={{ isGuestMode, guestUser, setGuestMode }}>
      {children}
    </GuestModeContext.Provider>
  );
}

export function useGuestMode() {
  const context = useContext(GuestModeContext);
  if (context === undefined) {
    throw new Error("useGuestMode must be used within a GuestModeProvider");
  }
  return context;
} 