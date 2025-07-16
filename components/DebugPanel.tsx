"use client";

import { useEffect, useState } from "react";
import { useGuestMode } from "./GuestModeProvider";
import { clientSessionUtils } from "@/lib/session-manager";

export default function DebugPanel() {
  const { isGuestMode, guestUser } = useGuestMode();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        isGuestMode,
        guestUser,
        localStorage: {
          guestMode: clientSessionUtils.isGuestMode(),
        },
        cookies: {
          session: document.cookie.includes("session="),
        },
        timestamp: new Date().toISOString(),
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    
    return () => clearInterval(interval);
  }, [isGuestMode, guestUser]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Panel</h3>
      <pre className="whitespace-pre-wrap overflow-auto">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      <div className="mt-2 space-y-1">
        <button
          onClick={() => clientSessionUtils.setGuestMode()}
          className="bg-blue-500 px-2 py-1 rounded text-xs mr-1"
        >
          Set Guest Mode
        </button>
        <button
          onClick={() => clientSessionUtils.clearGuestMode()}
          className="bg-red-500 px-2 py-1 rounded text-xs mr-1"
        >
          Clear Guest Mode
        </button>
        <button
          onClick={() => clientSessionUtils.clearAllSessions()}
          className="bg-orange-500 px-2 py-1 rounded text-xs"
        >
          Clear All
        </button>
      </div>
    </div>
  );
} 