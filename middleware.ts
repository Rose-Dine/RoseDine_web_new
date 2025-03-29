import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Remove middleware since we're using static export
export const config = {
  matcher: '/api/:path*',
}