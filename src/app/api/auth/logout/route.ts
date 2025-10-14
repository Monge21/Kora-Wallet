import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // For this example, we're just clearing the session cookie.
  // In a real app, you would also invalidate the session on the server.
  cookies().delete('session');

  const host = process.env.NEXT_PUBLIC_HOST || 'http://localhost:9002';
  return NextResponse.redirect(`${host}/install`);
}
