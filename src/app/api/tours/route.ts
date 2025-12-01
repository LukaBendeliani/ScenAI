import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/tours - List all tours for the authenticated user
export async function GET() {
  try {
    const session = await auth();
    
    console.log('Tours API - Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user?.id) {
      console.log('Tours API - No user id in session');
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No user id in session' },
        { status: 401 }
      );
    }

    const tours = await prisma.tour.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, tours });
  } catch (error) {
    console.error('Error fetching tours:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch tours', details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/tours - Create a new tour
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Tour name is required' },
        { status: 400 }
      );
    }

    // Create tour with empty editor state
    const initialEditorState = {
      scenes: [],
      nodes: [],
      edges: [],
    };

    const tour = await prisma.tour.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: session.user.id,
        editorState: initialEditorState,
      },
    });

    return NextResponse.json({
      success: true,
      tour: {
        id: tour.id,
        name: tour.name,
        description: tour.description,
        thumbnail: tour.thumbnail,
        createdAt: tour.createdAt,
        updatedAt: tour.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating tour:', error);
    return NextResponse.json(
      { error: 'Failed to create tour' },
      { status: 500 }
    );
  }
}

