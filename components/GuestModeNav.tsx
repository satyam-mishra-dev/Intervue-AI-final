"use client";

import { useGuestMode } from "./GuestModeProvider";

export default function GuestModeNav() {
  const { isGuestMode, setGuestMode } = useGuestMode();

  const handleSignOut = () => {
    if (isGuestMode) {
      setGuestMode(false);
      window.location.href = "/sign-in";
    }
  };

  if (!isGuestMode) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
        Guest Mode
      </span>
      <button
        onClick={handleSignOut}
        className="text-sm text-blue-600 hover:text-blue-800 underline"
      >
        Sign In
      </button>
    </div>
  );
} 