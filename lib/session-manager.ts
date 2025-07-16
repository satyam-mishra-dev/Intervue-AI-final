// Session management utilities
import { clearAllSessions } from './actions/auth.action';

export const sessionManager = {
  // Clear all session data (useful for fixing project ID mismatches)
  async clearAllSessions(): Promise<void> {
    try {
      await clearAllSessions();
      console.log('All sessions cleared successfully');
    } catch (error) {
      console.error('Error clearing sessions:', error);
    }
  },

  // Clear invalid sessions via API route
  async clearInvalidSessions(): Promise<void> {
    try {
      const response = await fetch('/api/auth/clear-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('Invalid sessions cleared via API');
      }
    } catch (error) {
      console.error('Error clearing invalid sessions:', error);
    }
  },

  // Clear client-side storage
  clearClientStorage(): void {
    try {
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        console.log('Client storage cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing client storage:', error);
    }
  },

  // Clear everything (both server and client)
  async clearEverything(): Promise<void> {
    await this.clearAllSessions();
    this.clearClientStorage();
    console.log('All session data cleared (server and client)');
  }
};

// Client-side session utilities (for use in components)
export const clientSessionUtils = {
  clearAllSessions: sessionManager.clearClientStorage,
  
  // Check if user is authenticated on client side
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check for any auth-related data
    const hasAuthData = localStorage.getItem('firebase:authUser:') || 
                       sessionStorage.getItem('firebase:authUser:') ||
                       document.cookie.includes('session');
    
    return !!hasAuthData;
  },
  
  // Force reload to clear any cached auth state
  forceReload(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  },
  
  // Guest mode utilities
  clearGuestMode() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("guestMode");
      console.log("Guest mode cleared");
    }
  },

  setGuestMode() {
    if (typeof window !== 'undefined') {
      localStorage.setItem("guestMode", "true");
      console.log("Guest mode enabled");
    }
  },

  isGuestMode() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("guestMode") === "true";
    }
    return false;
  }
}; 