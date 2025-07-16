import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from './firebase/admin-new';

// Enhanced error logging
function logError(context: string, error: any) {
  console.error(`❌ Middleware ${context}:`, error.message || error);
  if (error.code) {
    console.error(`   Error Code: ${error.code}`);
  }
}

// Enhanced session validation
async function validateSessionToken(sessionToken: string) {
  try {
    console.log('🔍 Middleware: Validating session token...');
    
    const decodedClaims = await adminAuth.verifySessionCookie(sessionToken, true);
    
    console.log(`✅ Middleware: Session valid for user: ${decodedClaims.uid}`);
    
    return { valid: true, user: decodedClaims };
  } catch (error: any) {
    logError('Session validation failed', error);
    return { valid: false, error: error.message };
  }
}

export async function middleware(request: NextRequest) {
  try {
    console.log(`🛡️ Middleware: Processing ${request.method} ${request.nextUrl.pathname}`);
    
    // Get session token from cookies
    const sessionToken = request.cookies.get('session')?.value;
    
    // Define protected routes
    const protectedRoutes = ['/interview', '/profile', '/dashboard'];
    const authRoutes = ['/sign-in', '/sign-up'];
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );
    const isAuthRoute = authRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );
    
    // Handle protected routes
    if (isProtectedRoute) {
      if (!sessionToken) {
        console.log('❌ Middleware: No session token, redirecting to sign-in');
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
      
      const { valid, user, error } = await validateSessionToken(sessionToken);
      
      if (!valid) {
        console.log('❌ Middleware: Invalid session token, redirecting to sign-in');
        
        // Create response that clears the invalid cookie
        const response = NextResponse.redirect(new URL('/sign-in', request.url));
        response.cookies.delete('session');
        
        return response;
      }
      
      // Add user info to headers for server components
      const requestHeaders = new Headers(request.headers);
      if (user) {
        requestHeaders.set('x-user-id', user.uid);
        requestHeaders.set('x-user-email', user.email || '');
        console.log(`✅ Middleware: Protected route access granted for user: ${user.uid}`);
      }
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    
    // Handle auth routes (redirect if already authenticated)
    if (isAuthRoute && sessionToken) {
      const { valid } = await validateSessionToken(sessionToken);
      
      if (valid) {
        console.log('✅ Middleware: User already authenticated, redirecting to interview');
        return NextResponse.redirect(new URL('/interview', request.url));
      } else {
        // Clear invalid session
        const response = NextResponse.next();
        response.cookies.delete('session');
        return response;
      }
    }
    
    // Allow all other routes
    console.log('✅ Middleware: Route allowed');
    return NextResponse.next();
    
  } catch (error: any) {
    logError('Middleware execution failed', error);
    
    // On error, allow the request to continue but log the issue
    console.log('⚠️ Middleware: Error occurred, allowing request to continue');
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|.*\\.).*)',
  ],
}; 