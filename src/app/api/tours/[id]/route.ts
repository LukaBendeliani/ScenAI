import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/tours/[id] - Get a specific tour with its editor state
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const tour = await prisma.tour.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tour: {
        id: tour.id,
        name: tour.name,
        description: tour.description,
        thumbnail: tour.thumbnail,
        editorState: tour.editorState,
        createdAt: tour.createdAt,
        updatedAt: tour.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching tour:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour' },
      { status: 500 }
    );
  }
}

// PUT /api/tours/[id] - Update a tour (name, description, or editor state)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, editorState, thumbnail } = body;

    // Verify ownership
    const existingTour = await prisma.tour.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: {
      name?: string;
      description?: string | null;
      editorState?: object;
      thumbnail?: string | null;
    } = {};

    if (name !== undefined) {
      if (!name?.trim()) {
        return NextResponse.json(
          { error: 'Tour name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (editorState !== undefined) {
      updateData.editorState = editorState;
    }

    if (thumbnail !== undefined) {
      updateData.thumbnail = thumbnail;
    }

    const tour = await prisma.tour.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      tour: {
        id: tour.id,
        name: tour.name,
        description: tour.description,
        thumbnail: tour.thumbnail,
        updatedAt: tour.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating tour:', error);
    return NextResponse.json(
      { error: 'Failed to update tour' },
      { status: 500 }
    );
  }
}

// DELETE /api/tours/[id] - Delete a tour
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify ownership
    const existingTour = await prisma.tour.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    await prisma.tour.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tour:', error);
    return NextResponse.json(
      { error: 'Failed to delete tour' },
      { status: 500 }
    );
  }
}

