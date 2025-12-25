'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Scene, SceneNode, SceneEdge } from '@/types';
import { useSession } from 'next-auth/react';

export interface Tour {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EditorState {
  scenes: Scene[];
  nodes: SceneNode[];
  edges: SceneEdge[];
}

interface TourContextType {
  tours: Tour[];
  currentTourId: string | null;
  currentTour: Tour | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: string | null;
  fetchTours: () => Promise<void>;
  createTour: (name: string, description?: string) => Promise<string | null>;
  selectTour: (tourId: string | null) => Promise<EditorState | null>;
  deleteTour: (tourId: string) => Promise<boolean>;
  renameTour: (tourId: string, name: string) => Promise<boolean>;
  saveCurrentTour: (state: EditorState) => Promise<boolean>;
  markUnsavedChanges: () => void;
  setIsTourSelectorOpen: (isOpen: boolean) => void;
  isTourSelectorOpen: boolean;
}

const TourContext = createContext<TourContextType | null>(null);

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [currentTourId, setCurrentTourId] = useState<string | null>(null);
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTourSelectorOpen, setIsTourSelectorOpen] = useState(false);

  const session = useSession();

  // Ref to store the current editor state for auto-save
  const editorStateRef = useRef<EditorState | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all tours for the user
  const fetchTours = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/tours');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tours');
      }

      setTours(data.tours);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tours';
      setError(message);
      console.error('Error fetching tours:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new tour
  const createTour = useCallback(async (name: string, description?: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tour');
      }

      setTours((prev) => [data.tour, ...prev]);
      return data.tour.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create tour';
      setError(message);
      console.error('Error creating tour:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Select and load a tour
  const selectTour = useCallback(async (tourId: string | null): Promise<EditorState | null> => {
    if (!tourId) {
      setCurrentTourId(null);
      setCurrentTour(null);
      editorStateRef.current = null;
      setHasUnsavedChanges(false);
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/tours/${tourId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load tour');
      }

      setCurrentTourId(tourId);
      setCurrentTour(data.tour);
      setHasUnsavedChanges(false);
      setLastSaved(new Date(data.tour.updatedAt));

      const editorState = data.tour.editorState as EditorState;
      editorStateRef.current = editorState;

      return editorState;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tour';
      setError(message);
      console.error('Error loading tour:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a tour
  const deleteTour = useCallback(async (tourId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete tour');
      }

      setTours((prev) => prev.filter((t) => t.id !== tourId));

      if (currentTourId === tourId) {
        setCurrentTourId(null);
        setCurrentTour(null);
        editorStateRef.current = null;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete tour';
      setError(message);
      console.error('Error deleting tour:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentTourId]);

  // Rename a tour
  const renameTour = useCallback(async (tourId: string, name: string): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to rename tour');
      }

      setTours((prev) =>
        prev.map((t) => (t.id === tourId ? { ...t, name: data.tour.name } : t))
      );

      if (currentTourId === tourId && currentTour) {
        setCurrentTour({ ...currentTour, name: data.tour.name });
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rename tour';
      setError(message);
      console.error('Error renaming tour:', err);
      return false;
    }
  }, [currentTourId, currentTour]);

  // Save the current tour state
  const saveCurrentTour = useCallback(async (state: EditorState): Promise<boolean> => {
    if (!currentTourId) return false;

    try {
      setIsSaving(true);
      setError(null);

      // Update the thumbnail from the first scene if available
      const thumbnail = state.scenes[0]?.thumbnail || null;

      const response = await fetch(`/api/tours/${currentTourId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editorState: state,
          thumbnail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save tour');
      }

      editorStateRef.current = state;
      setHasUnsavedChanges(false);
      setLastSaved(new Date());

      // Update tour in list
      setTours((prev) =>
        prev.map((t) =>
          t.id === currentTourId
            ? { ...t, thumbnail, updatedAt: data.tour.updatedAt }
            : t
        )
      );

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save tour';
      setError(message);
      console.error('Error saving tour:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [currentTourId]);

  // Mark that there are unsaved changes
  const markUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (currentTourId && hasUnsavedChanges) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer for auto-save
      autoSaveTimerRef.current = setTimeout(() => {
        if (editorStateRef.current) {
          saveCurrentTour(editorStateRef.current);
        }
      }, AUTO_SAVE_INTERVAL);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [currentTourId, hasUnsavedChanges, saveCurrentTour]);

  // Fetch tours on mount
  useEffect(() => {
    if (session.data?.user) {
      fetchTours();
    }
  }, [fetchTours]);

  return (
    <TourContext.Provider
      value={{
        tours,
        currentTourId,
        currentTour,
        isLoading,
        isSaving,
        lastSaved,
        hasUnsavedChanges,
        error,
        fetchTours,
        createTour,
        selectTour,
        deleteTour,
        renameTour,
        saveCurrentTour,
        markUnsavedChanges,
        setIsTourSelectorOpen,
        isTourSelectorOpen,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTourContext() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTourContext must be used within a TourProvider');
  }
  return context;
}

