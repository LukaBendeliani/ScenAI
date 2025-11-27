'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Scene, SceneNode, SceneEdge, SceneContextType, Hotspot } from '@/types';

const SceneContext = createContext<SceneContextType | null>(null);

const EXAMPLE_SCENES: Scene[] = [
  {
    id: 'scene-1',
    name: 'Mountain Vista',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2048&h=1024&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
    hotspots: [],
    createdAt: Date.now() - 100000,
  },
  {
    id: 'scene-2',
    name: 'Urban Neon',
    imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=2048&h=1024&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=200&fit=crop',
    hotspots: [],
    createdAt: Date.now() - 50000,
  },
  {
    id: 'scene-3',
    name: 'Cyber Street',
    imageUrl: 'https://images.unsplash.com/photo-1545486332-9e0999c535b2?w=2048&h=1024&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1545486332-9e0999c535b2?w=400&h=200&fit=crop',
    hotspots: [],
    createdAt: Date.now(),
  },
];

export function SceneProvider({ children }: { children: React.ReactNode }) {
  const [scenes, setScenes] = useState<Scene[]>(EXAMPLE_SCENES);
  const [nodes, setNodes] = useState<SceneNode[]>([]);
  const [edges, setEdges] = useState<SceneEdge[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [viewingSceneId, setViewingSceneId] = useState<string | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize nodes from scenes
  useEffect(() => {
    const initialNodes: SceneNode[] = scenes.map((scene, index) => ({
      id: scene.id,
      type: 'scene',
      position: { x: 100 + (index % 3) * 320, y: 100 + Math.floor(index / 3) * 280 },
      data: {
        scene,
        onEdit: () => {},
        onDelete: () => {},
        onView: () => {},
      },
    }));
    setNodes(initialNodes);
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
    const nodeCount = nodes.length;
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
    setNodes((prev) => [...prev, newNode]);
    
    return id;
  }, [nodes.length]);

  const updateScene = useCallback((id: string, updates: Partial<Scene>) => {
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === id ? { ...scene, ...updates } : scene
      )
    );
  }, []);

  const deleteScene = useCallback((id: string) => {
    setScenes((prev) => prev.filter((scene) => scene.id !== id));
    setNodes((prev) => prev.filter((node) => node.id !== id));
    setEdges((prev) => prev.filter((edge) => edge.source !== id && edge.target !== id));
    if (selectedSceneId === id) setSelectedSceneId(null);
    if (viewingSceneId === id) setViewingSceneId(null);
  }, [selectedSceneId, viewingSceneId]);

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
  }, []);

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
  }, []);

  const deleteHotspot = useCallback((sceneId: string, hotspotId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
    const hotspot = scene?.hotspots.find((h) => h.id === hotspotId);
    
    setScenes((prev) =>
      prev.map((s) =>
        s.id === sceneId
          ? { ...s, hotspots: s.hotspots.filter((h) => h.id !== hotspotId) }
          : s
      )
    );
    
    // Remove edge if this was the last hotspot to that target
    if (hotspot?.targetSceneId) {
      const remainingHotspots = scene?.hotspots.filter(
        (h) => h.id !== hotspotId && h.targetSceneId === hotspot.targetSceneId
      );
      if (!remainingHotspots?.length) {
        setEdges((prev) =>
          prev.filter(
            (e) => !(e.source === sceneId && e.target === hotspot.targetSceneId)
          )
        );
      }
    }
  }, [scenes]);

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
        setNodes,
        setEdges,
        selectScene,
        viewScene,
        addHotspot,
        updateHotspot,
        deleteHotspot,
        openCreator,
        closeCreator,
        toggleSidebar,
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

