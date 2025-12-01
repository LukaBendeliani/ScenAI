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
function EditorContent() {
  const { 
    currentTourId, 
    selectTour, 
    saveCurrentTour, 
    markUnsavedChanges,
    hasUnsavedChanges,
    isTourSelectorOpen,
    setIsTourSelectorOpen,
  } = useTourContext();
  
  const { loadState, getState, clearState } = useSceneContext();
  const isLoadingTourRef = useRef(false);

  // Handle state changes for auto-save tracking
  const handleStateChange = useCallback(() => {
    if (!isLoadingTourRef.current) {
      markUnsavedChanges();
    }
  }, [markUnsavedChanges]);

  // Load tour when selected
  useEffect(() => {
    if (currentTourId && !isLoadingTourRef.current) {
      isLoadingTourRef.current = true;
      selectTour(currentTourId).then((state) => {
        if (state) {
          loadState(state.scenes || [], state.nodes || [], state.edges || []);
        }
        isLoadingTourRef.current = false;
      });
    } else if (!currentTourId) {
      clearState();
    }
  }, [currentTourId, selectTour, loadState, clearState]);

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

  // Show tour selector if no tour is selected or if explicitly opened
  if (!currentTourId || isTourSelectorOpen) {
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
function EditorWithSceneProvider() {
  const { markUnsavedChanges } = useTourContext();

  return (
    <SceneProvider onStateChange={markUnsavedChanges}>
      <ReactFlowProvider>
        <EditorContent />
      </ReactFlowProvider>
    </SceneProvider>
  );
}

export default function EditorWrapper() {
  // Add body class to prevent scrolling in editor
  useEffect(() => {
    document.body.classList.add('editor-page');
    return () => {
      document.body.classList.remove('editor-page');
    };
  }, []);

  return (
    <TourProvider>
      <EditorWithSceneProvider />
    </TourProvider>
  );
}
