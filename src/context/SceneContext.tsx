'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Scene, SceneNode, SceneEdge, SceneContextType, Hotspot } from '@/types';

// Extended context type with tour integration
interface ExtendedSceneContextType extends SceneContextType {
  loadState: (scenes: Scene[], nodes: SceneNode[], edges: SceneEdge[]) => void;
  getState: () => { scenes: Scene[]; nodes: SceneNode[]; edges: SceneEdge[] };
  clearState: () => void;
  onStateChange?: () => void;
}

const SceneContext = createContext<ExtendedSceneContextType | null>(null);

export function SceneProvider({ 
  children,
  onStateChange,
}: { 
  children: React.ReactNode;
  onStateChange?: () => void;
}) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [nodes, setNodes] = useState<SceneNode[]>([]);
  const [edges, setEdges] = useState<SceneEdge[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [viewingSceneId, setViewingSceneId] = useState<string | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Track if we should trigger state change callbacks
  const isInitialLoadRef = useRef(true);
  const onStateChangeRef = useRef(onStateChange);
  
  // Update ref when callback changes
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Trigger state change callback (debounced internally)
  const triggerStateChange = useCallback(() => {
    if (!isInitialLoadRef.current && onStateChangeRef.current) {
      onStateChangeRef.current();
    }
  }, []);

  // Update node data when scenes change
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const scene = scenes.find((s) => s.id === node.id);
        if (scene) {
          return {
            ...node,
            data: {
              ...node.data,
              scene,
            },
          };
        }
        return node;
      })
    );
  }, [scenes]);

  // Load state from a tour
  const loadState = useCallback((newScenes: Scene[], newNodes: SceneNode[], newEdges: SceneEdge[]) => {
    isInitialLoadRef.current = true;
    setScenes(newScenes);
    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedSceneId(null);
    setViewingSceneId(null);
    // Allow state changes to be tracked after a short delay
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  }, []);

  // Get current state for saving
  const getState = useCallback(() => {
    return { scenes, nodes, edges };
  }, [scenes, nodes, edges]);

  // Clear all state
  const clearState = useCallback(() => {
    isInitialLoadRef.current = true;
    setScenes([]);
    setNodes([]);
    setEdges([]);
    setSelectedSceneId(null);
    setViewingSceneId(null);
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  }, []);

  const addScene = useCallback((sceneData: Omit<Scene, 'id' | 'createdAt' | 'hotspots'>) => {
    const id = uuidv4();
    const newScene: Scene = {
      ...sceneData,
      id,
      hotspots: [],
      createdAt: Date.now(),
    };
    
    setScenes((prev) => [...prev, newScene]);
    
    // Add new node
    setNodes((prev) => {
      const nodeCount = prev.length;
      const newNode: SceneNode = {
        id,
        type: 'scene',
        position: { x: 100 + (nodeCount % 3) * 320, y: 100 + Math.floor(nodeCount / 3) * 280 },
        data: {
          scene: newScene,
          onEdit: () => {},
          onDelete: () => {},
          onView: () => {},
        },
      };
      return [...prev, newNode];
    });
    
    triggerStateChange();
    return id;
  }, [triggerStateChange]);

  const updateScene = useCallback((id: string, updates: Partial<Scene>) => {
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === id ? { ...scene, ...updates } : scene
      )
    );
    triggerStateChange();
  }, [triggerStateChange]);

  const deleteScene = useCallback((id: string) => {
    setScenes((prev) => prev.filter((scene) => scene.id !== id));
    setNodes((prev) => prev.filter((node) => node.id !== id));
    setEdges((prev) => prev.filter((edge) => edge.source !== id && edge.target !== id));
    if (selectedSceneId === id) setSelectedSceneId(null);
    if (viewingSceneId === id) setViewingSceneId(null);
    triggerStateChange();
  }, [selectedSceneId, viewingSceneId, triggerStateChange]);

  const selectScene = useCallback((id: string | null) => {
    setSelectedSceneId(id);
  }, []);

  const viewScene = useCallback((id: string | null) => {
    setViewingSceneId(id);
  }, []);

  const addHotspot = useCallback((sceneId: string, hotspot: Omit<Hotspot, 'id'>) => {
    const id = uuidv4();
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === sceneId
          ? { ...scene, hotspots: [...scene.hotspots, { ...hotspot, id }] }
          : scene
      )
    );
    
    // Add edge for the connection
    if (hotspot.targetSceneId) {
      const newEdge: SceneEdge = {
        id: `edge-${sceneId}-${hotspot.targetSceneId}`,
        source: sceneId,
        target: hotspot.targetSceneId,
        animated: true,
        style: { stroke: '#00F0FF', strokeWidth: 2 },
      };
      setEdges((prev) => {
        const exists = prev.some(
          (e) => e.source === sceneId && e.target === hotspot.targetSceneId
        );
        return exists ? prev : [...prev, newEdge];
      });
    }
    
    triggerStateChange();
  }, [triggerStateChange]);

  const updateHotspot = useCallback((sceneId: string, hotspotId: string, updates: Partial<Hotspot>) => {
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              hotspots: scene.hotspots.map((h) =>
                h.id === hotspotId ? { ...h, ...updates } : h
              ),
            }
          : scene
      )
    );
    triggerStateChange();
  }, [triggerStateChange]);

  const deleteHotspot = useCallback((sceneId: string, hotspotId: string) => {
    let targetSceneId: string | undefined;
    
    setScenes((prev) => {
      const scene = prev.find((s) => s.id === sceneId);
      const hotspot = scene?.hotspots.find((h) => h.id === hotspotId);
      targetSceneId = hotspot?.targetSceneId;
      
      return prev.map((s) =>
        s.id === sceneId
          ? { ...s, hotspots: s.hotspots.filter((h) => h.id !== hotspotId) }
          : s
      );
    });
    
    // Remove edge if this was the last hotspot to that target
    if (targetSceneId) {
      setScenes((currentScenes) => {
        const scene = currentScenes.find((s) => s.id === sceneId);
        const remainingHotspots = scene?.hotspots.filter(
          (h) => h.targetSceneId === targetSceneId
        );
        if (!remainingHotspots?.length) {
          setEdges((prev) =>
            prev.filter(
              (e) => !(e.source === sceneId && e.target === targetSceneId)
            )
          );
        }
        return currentScenes;
      });
    }
    
    triggerStateChange();
  }, [triggerStateChange]);

  // Wrapper for setNodes that triggers state change
  const setNodesWithChange = useCallback((updater: React.SetStateAction<SceneNode[]>) => {
    setNodes(updater);
    triggerStateChange();
  }, [triggerStateChange]);

  // Wrapper for setEdges that triggers state change
  const setEdgesWithChange = useCallback((updater: React.SetStateAction<SceneEdge[]>) => {
    setEdges(updater);
    triggerStateChange();
  }, [triggerStateChange]);

  const openCreator = useCallback(() => setIsCreatorOpen(true), []);
  const closeCreator = useCallback(() => setIsCreatorOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);

  return (
    <SceneContext.Provider
      value={{
        scenes,
        nodes,
        edges,
        selectedSceneId,
        viewingSceneId,
        isCreatorOpen,
        isSidebarOpen,
        addScene,
        updateScene,
        deleteScene,
        setNodes: setNodesWithChange,
        setEdges: setEdgesWithChange,
        selectScene,
        viewScene,
        addHotspot,
        updateHotspot,
        deleteHotspot,
        openCreator,
        closeCreator,
        toggleSidebar,
        loadState,
        getState,
        clearState,
        onStateChange,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}

export function useSceneContext() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useSceneContext must be used within a SceneProvider');
  }
  return context;
}
