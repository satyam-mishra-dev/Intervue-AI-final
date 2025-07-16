import { cookies } from "next/headers";

// Session cookie management
export class SessionManager {
  static async clearSessionCookies() {
    const cookieStore = await cookies();
    
    // Clear all possible session cookies
    cookieStore.delete("session");
    cookieStore.delete("firebase-session");
    cookieStore.delete("auth-session");
    
    console.log("Session cookies cleared");
  }

  static async getSessionCookie() {
    const cookieStore = await cookies();
    return cookieStore.get("session")?.value;
  }

  static async setSessionCookie(sessionCookie: string, maxAge: number = 60 * 60 * 24 * 7) {
    const cookieStore = await cookies();
    
    cookieStore.set("session", sessionCookie, {
      maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });
  }

  static async validateSession() {
    const sessionCookie = await this.getSessionCookie();
    
    if (!sessionCookie) {
      return { isValid: false, reason: "No session cookie" };
    }

    // Additional validation can be added here
    return { isValid: true };
  }
}

// Client-side session utilities
export const clientSessionUtils = {
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
  },

  clearAllSessions() {
    if (typeof window !== 'undefined') {
      // Clear localStorage
      localStorage.removeItem("guestMode");
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear cookies (client-side)
      document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "firebase-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "auth-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      console.log("All client-side sessions cleared");
    }
  }
}; 