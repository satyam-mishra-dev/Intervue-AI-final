import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";

import { isAuthenticated } from "@/lib/actions/auth.action";
import GuestModeBypass from "@/components/GuestModeBypass";
import { GuestModeProvider } from "@/components/GuestModeProvider";

const Layout = async ({ children }: { children: ReactNode }) => {
  // Try to get authentication status, but don't fail if Firebase is not available
  let isUserAuthenticated = false;
  try {
    isUserAuthenticated = await isAuthenticated();
  } catch (error) {
    console.log("Authentication check failed, allowing guest mode:", error);
  }

  return (
    <GuestModeProvider>
      <GuestModeBypass isAuthenticated={isUserAuthenticated}>
        <div className="root-layout">
          <nav>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="MockMate Logo" width={38} height={32} />
              <h2 className="text-primary-100">InterVue AI</h2>
          </Link>
          </nav>

          {children}
        </div>
      </GuestModeBypass>
    </GuestModeProvider>
  );
};

export default Layout;
