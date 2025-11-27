import { Node, Edge } from '@xyflow/react';

export interface Hotspot {
  id: string;
  position: { x: number; y: number; z: number };
  targetSceneId: string;
  label?: string;
}

// Cube face identifiers
export type CubeFaceId = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

// Cube face images for cubemap panoramas
export interface CubeImages {
  front: string;
  back: string;
  left: string;
  right: string;
  top: string;
  bottom: string;
}

// Cube face metadata
export interface CubeFace {
  id: CubeFaceId;
  label: string;
  icon: string;
}

export const CUBE_FACES: CubeFace[] = [
  { id: 'front', label: 'Front (Z+)', icon: '◉' },
  { id: 'back', label: 'Back (Z-)', icon: '○' },
  { id: 'left', label: 'Left (X-)', icon: '←' },
  { id: 'right', label: 'Right (X+)', icon: '→' },
  { id: 'top', label: 'Top (Y+)', icon: '↑' },
  { id: 'bottom', label: 'Bottom (Y-)', icon: '↓' },
];

export interface Scene {
  id: string;
  name: string;
  imageUrl: string;
  thumbnail?: string;
  hotspots: Hotspot[];
  createdAt: number;
  // New fields for panorama type
  panoramaType?: 'sphere' | 'cube';
  cubeImages?: CubeImages;
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
