import { Node, Edge } from '@xyflow/react';

export interface Hotspot {
  id: string;
  position: { x: number; y: number; z: number };
  targetSceneId: string;
  label?: string;
}

export interface Scene {
  id: string;
  name: string;
  imageUrl: string;
  thumbnail?: string;
  hotspots: Hotspot[];
  createdAt: number;
}

export interface SceneNodeData extends Record<string, unknown> {
  scene: Scene;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export type SceneNode = Node<SceneNodeData, 'scene'>;
export type SceneEdge = Edge;

export interface SceneContextType {
  scenes: Scene[];
  nodes: SceneNode[];
  edges: SceneEdge[];
  selectedSceneId: string | null;
  viewingSceneId: string | null;
  isCreatorOpen: boolean;
  isSidebarOpen: boolean;
  addScene: (scene: Omit<Scene, 'id' | 'createdAt' | 'hotspots'>) => string;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  setNodes: React.Dispatch<React.SetStateAction<SceneNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<SceneEdge[]>>;
  selectScene: (id: string | null) => void;
  viewScene: (id: string | null) => void;
  addHotspot: (sceneId: string, hotspot: Omit<Hotspot, 'id'>) => void;
  updateHotspot: (sceneId: string, hotspotId: string, updates: Partial<Hotspot>) => void;
  deleteHotspot: (sceneId: string, hotspotId: string) => void;
  openCreator: () => void;
  closeCreator: () => void;
  toggleSidebar: () => void;
}
