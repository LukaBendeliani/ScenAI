'use client';

import React, { useRef, useCallback, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { CubeImages } from '@/types';

interface PanoramaCubeProps {
  cubeImages: CubeImages;
  isPlacementMode: boolean;
  onPlaceHotspot: (position: { x: number; y: number; z: number }) => void;
}

// Size of the cube (same as sphere radius for consistency)
const CUBE_SIZE = 10;

// Face configurations - planes face INWARD toward the camera at center
// Position is at the face location, rotation makes the plane face the center
const FACE_CONFIGS: {
  id: keyof CubeImages;
  position: [number, number, number];
  rotation: [number, number, number];
}[] = [
  // Front face - at -Z, facing +Z (toward center)
  { id: 'front', position: [0, 0, -CUBE_SIZE / 2], rotation: [0, 0, 0] },
  // Back face - at +Z, facing -Z (toward center)
  { id: 'back', position: [0, 0, CUBE_SIZE / 2], rotation: [0, Math.PI, 0] },
  // Left face - at -X, facing +X (toward center)
  { id: 'left', position: [-CUBE_SIZE / 2, 0, 0], rotation: [0, Math.PI / 2, 0] },
  // Right face - at +X, facing -X (toward center)
  { id: 'right', position: [CUBE_SIZE / 2, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  // Top face - at +Y, facing -Y (toward center)
  { id: 'top', position: [0, CUBE_SIZE / 2, 0], rotation: [Math.PI / 2, 0, 0] },
  // Bottom face - at -Y, facing +Y (toward center)
  { id: 'bottom', position: [0, -CUBE_SIZE / 2, 0], rotation: [-Math.PI / 2, 0, 0] },
];

interface CubeFaceProps {
  imageUrl: string;
  position: [number, number, number];
  rotation: [number, number, number];
  isPlacementMode: boolean;
  onClick: (point: THREE.Vector3) => void;
}

function CubeFace({ imageUrl, position, rotation, isPlacementMode, onClick }: CubeFaceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(imageUrl);

  // Configure texture
  useMemo(() => {
    if (texture) {
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [texture]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (!isPlacementMode) return;
    e.stopPropagation();
    
    if (e.point) {
      // Normalize the click point to a radius of 4.5 (inside the cube)
      const normalized = e.point.clone().normalize().multiplyScalar(4.5);
      onClick(normalized);
    }
  }, [isPlacementMode, onClick]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onClick={handleClick}
    >
      <planeGeometry args={[CUBE_SIZE, CUBE_SIZE]} />
      <meshBasicMaterial map={texture} side={THREE.FrontSide} />
    </mesh>
  );
}

export default function PanoramaCube({ cubeImages, isPlacementMode, onPlaceHotspot }: PanoramaCubeProps) {
  const handleFaceClick = useCallback((point: THREE.Vector3) => {
    onPlaceHotspot({ x: point.x, y: point.y, z: point.z });
  }, [onPlaceHotspot]);

  return (
    <group>
      {FACE_CONFIGS.map((config) => (
        <CubeFace
          key={config.id}
          imageUrl={cubeImages[config.id]}
          position={config.position}
          rotation={config.rotation}
          isPlacementMode={isPlacementMode}
          onClick={handleFaceClick}
        />
      ))}
    </group>
  );
}
