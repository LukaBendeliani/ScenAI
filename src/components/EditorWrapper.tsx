'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { SceneProvider, useSceneContext } from '@/context/SceneContext';
import { TourProvider, useTourContext } from '@/context/TourContext';
import Sidebar from './Sidebar';
import SceneEditor from './SceneEditor';
import SceneViewer from './SceneViewer';
import SceneCreator from './SceneCreator';
import TourSelector from './TourSelector';
import SaveIndicator from './SaveIndicator';

// Inner component that connects Tour and Scene contexts
function EditorContent({ tourId }: { tourId?: string }) {
  const {
    currentTourId,
    selectTour,
    saveCurrentTour,
    markUnsavedChanges,
    hasUnsavedChanges,
    isTourSelectorOpen,
    setIsTourSelectorOpen,
    isLoading,
  } = useTourContext();

  const { loadState, getState, clearState } = useSceneContext();
  const isLoadingTourRef = useRef(false);

  // Handle state changes for auto-save tracking
  const handleStateChange = useCallback(() => {
    if (!isLoadingTourRef.current) {
      markUnsavedChanges();
    }
  }, [markUnsavedChanges]);

  // Select tour from URL prop
  useEffect(() => {
    if (tourId && tourId !== currentTourId && !isLoadingTourRef.current) {
      isLoadingTourRef.current = true;
      selectTour(tourId).then((state) => {
        if (state) {
          loadState(state.scenes || [], state.nodes || [], state.edges || []);
        } else {
          // Handle error or redirect if tour not found? 
          // For now just clear state
          clearState();
        }
        isLoadingTourRef.current = false;
      });
    } else if (!tourId && !currentTourId) {
      // Only clear if neither exists (though this case shouldn't happen with [tourId] route)
      clearState();
    }
  }, [tourId, currentTourId, selectTour, loadState, clearState]);

  // Manual save function
  const handleSave = useCallback(async () => {
    const state = getState();
    await saveCurrentTour(state);
  }, [getState, saveCurrentTour]);

  // Keyboard shortcut for save (Ctrl/Cmd + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (currentTourId && hasUnsavedChanges) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTourId, hasUnsavedChanges, handleSave]);

  // Show loading state while fetching tour
  if (isLoading || (tourId && tourId !== currentTourId)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-primary, #0A0A0E)' }}>
        <div className="text-center">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full animate-spin"
            style={{
              border: '3px solid var(--border-dark, #303540)',
              borderTopColor: 'var(--neon-blue, #00F0FF)',
            }}
          />
          <p style={{ color: 'var(--text-secondary, #A0A0B0)', fontSize: '14px' }}>
            Loading Tour...
          </p>
        </div>
      </div>
    );
  }

  // Show tour selector if explicitly opened
  if (isTourSelectorOpen) {
    return <TourSelector onClose={() => setIsTourSelectorOpen(false)} />;
  }

  return (
    <>
      <div className="flex h-screen w-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Editor */}
        <main className="flex-1 relative overflow-hidden">
          <SceneEditor />

          {/* Save Indicator */}
          <SaveIndicator onSave={handleSave} />
        </main>

        {/* Modals & Overlays */}
        <SceneViewer />
        <SceneCreator />
      </div>
    </>
  );
}

// Wrapper that provides state change callback to SceneProvider
function EditorWithSceneProvider({ tourId }: { tourId?: string }) {
  const { markUnsavedChanges } = useTourContext();

  return (
    <SceneProvider onStateChange={markUnsavedChanges}>
      <ReactFlowProvider>
        <EditorContent tourId={tourId} />
      </ReactFlowProvider>
    </SceneProvider>
  );
}

export default function EditorWrapper({ tourId }: { tourId?: string }) {
  // Add body class to prevent scrolling in editor
  useEffect(() => {
    document.body.classList.add('editor-page');
    return () => {
      document.body.classList.remove('editor-page');
    };
  }, []);

  return (
    <TourProvider>
      <EditorWithSceneProvider tourId={tourId} />
    </TourProvider>
  );
}
