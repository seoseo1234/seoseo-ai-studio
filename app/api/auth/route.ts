import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    
    // In a real app, this should be stored in environment variables.
    // e.g., const validCode = process.env.ADMIN_ACCESS_CODE;
    // For this prototype, we'll hardcode or use a default if env is not set.
    const validCode = process.env.ADMIN_ACCESS_CODE || 'admin123';

    if (code === validCode) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid code' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
