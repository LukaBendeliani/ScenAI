'use client';

import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { SceneProvider } from '@/context/SceneContext';
import Sidebar from './Sidebar';
import SceneEditor from './SceneEditor';
import SceneViewer from './SceneViewer';
import SceneCreator from './SceneCreator';

export default function EditorWrapper() {
  return (
    <SceneProvider>
      <ReactFlowProvider>
        <div className="flex h-screen w-screen overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Editor */}
          <main className="flex-1 relative overflow-hidden">
            <SceneEditor />
          </main>

          {/* Modals & Overlays */}
          <SceneViewer />
          <SceneCreator />
        </div>
      </ReactFlowProvider>
    </SceneProvider>
  );
}

