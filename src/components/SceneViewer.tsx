'use client';

import React, { useRef, useState, useCallback, Suspense, useEffect } from 'react';
import { Canvas, useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { useSceneContext } from '@/context/SceneContext';
import PanoramaCube from './PanoramaCube';

interface HotspotMarkerProps {
  position: [number, number, number];
  label?: string;
  onClick: () => void;
  onDelete: () => void;
  targetSceneName?: string;
  isPreview?: boolean;
}

function HotspotMarker({ position, label, onClick, onDelete, targetSceneName, isPreview }: HotspotMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle hover with delay for hiding tooltip
  const handlePointerOver = useCallback(() => {
    if (isPreview) return;
    // Cancel any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setHovered(true);
    setShowTooltip(true);
  }, [isPreview]);

  const handlePointerOut = useCallback(() => {
    if (isPreview) return;
    setHovered(false);
    // Delay hiding the tooltip by 2 seconds
    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 2000);
  }, [isPreview]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      const baseScale = isPreview ? 1.3 : 1;
      const scale = hovered ? baseScale * 1.2 : baseScale + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={(e) => {
          if (isPreview) return;
          e.stopPropagation();
          onClick();
        }}
      >
        <torusGeometry args={[0.3, 0.1, 16, 32]} />
        <meshStandardMaterial
          color={isPreview ? '#00FF00' : (hovered ? '#FF0080' : '#00F0FF')}
          emissive={isPreview ? '#00FF00' : (hovered ? '#FF0080' : '#00F0FF')}
          emissiveIntensity={isPreview ? 0.8 : 0.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight color={isPreview ? '#00FF00' : '#00F0FF'} intensity={isPreview ? 2 : 1} distance={3} />

      {isPreview && (
        <Html center distanceFactor={10}>
          <div
            className="px-3 py-2 rounded-lg whitespace-nowrap"
            style={{
              backgroundColor: 'rgba(21, 24, 32, 0.95)',
              border: '1px solid #00FF00',
              boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
            }}
          >
            <p className="text-xs font-medium" style={{ color: '#00FF00' }}>
              New Hotspot Location
            </p>
          </div>
        </Html>
      )}

      {!isPreview && showTooltip && (
        <Html center distanceFactor={10}>
          <div
            className="px-3 py-2 rounded-lg whitespace-nowrap"
            style={{
              backgroundColor: 'rgba(21, 24, 32, 0.95)',
              border: '1px solid var(--neon-blue)',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)',
            }}
            onMouseEnter={() => {
              // Cancel hide timeout when mouse enters tooltip
              if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              // Start hide timeout when mouse leaves tooltip
              hideTimeoutRef.current = setTimeout(() => {
                setShowTooltip(false);
              }, 2000);
            }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--neon-blue)' }}>
              {label || 'Hotspot'}
            </p>
            {targetSceneName && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                → {targetSceneName}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                  setShowTooltip(false);
                }}
                className="px-2 py-1 rounded text-xs hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: 'rgba(0, 240, 255, 0.2)',
                  color: 'var(--neon-blue)',
                }}
              >
                Navigate
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowTooltip(false);
                }}
                className="px-2 py-1 rounded text-xs hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: 'rgba(255, 0, 128, 0.2)',
                  color: 'var(--neon-pink)',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

interface PanoramaSphereProps {
  imageUrl: string;
  isPlacementMode: boolean;
  onPlaceHotspot: (position: { x: number; y: number; z: number }) => void;
}

function PanoramaSphere({ imageUrl, isPlacementMode, onPlaceHotspot }: PanoramaSphereProps) {
  const texture = useTexture(imageUrl);
  const meshRef = useRef<THREE.Mesh>(null);

  // Configure texture
  useEffect(() => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.repeat.x = -1;
      texture.needsUpdate = true;
    }
  }, [texture]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (!isPlacementMode) return;
    e.stopPropagation();

    if (e.point) {
      const normalized = e.point.clone().normalize().multiplyScalar(9.5);
      onPlaceHotspot({ x: normalized.x, y: normalized.y, z: normalized.z });
    }
  }, [isPlacementMode, onPlaceHotspot]);

  return (
    <mesh
      ref={meshRef}
      scale={[-1, 1, 1]}
      onClick={handleClick}
    >
      <sphereGeometry args={[10, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function CameraController() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 0.1);
  }, [camera]);

  return (
    <OrbitControls
      enableZoom={true}
      enablePan={true}
      rotateSpeed={-0.3}
      minPolarAngle={Math.PI * 0.1}
      maxPolarAngle={Math.PI * 0.9}

    />
  );
}

function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-16 h-16 mx-auto mb-4 rounded-full"
          style={{
            border: '3px solid var(--border-dark)',
            borderTopColor: 'var(--neon-blue)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Loading panorama...
        </p>
      </motion.div>
    </div>
  );
}

export default function SceneViewer() {
  const {
    scenes,
    viewingSceneId,
    viewScene,
    addHotspot,
    deleteHotspot,
  } = useSceneContext();

  // Step 1: Placement mode - user clicks to place hotspot
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  // Step 2: After placement, show modal to select target scene
  const [pendingHotspotPosition, setPendingHotspotPosition] = useState<{ x: number; y: number; z: number } | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [hotspotLabel, setHotspotLabel] = useState('');

  const currentScene = scenes.find((s) => s.id === viewingSceneId);

  // Start placement mode
  const startPlacementMode = useCallback(() => {
    setIsPlacementMode(true);
    setPendingHotspotPosition(null);
    setSelectedTargetId(null);
    setHotspotLabel('');
  }, []);

  // Handle hotspot placement on panorama click
  const handlePlaceHotspot = useCallback((position: { x: number; y: number; z: number }) => {
    setPendingHotspotPosition(position);
    setIsPlacementMode(false);
  }, []);

  // Cancel placement
  const cancelPlacement = useCallback(() => {
    setIsPlacementMode(false);
    setPendingHotspotPosition(null);
    setSelectedTargetId(null);
    setHotspotLabel('');
  }, []);

  // Confirm and create hotspot
  const confirmHotspot = useCallback(() => {
    if (!viewingSceneId || !pendingHotspotPosition || !selectedTargetId) return;

    addHotspot(viewingSceneId, {
      position: pendingHotspotPosition,
      targetSceneId: selectedTargetId,
      label: hotspotLabel || 'Hotspot',
    });

    setPendingHotspotPosition(null);
    setSelectedTargetId(null);
    setHotspotLabel('');
  }, [viewingSceneId, pendingHotspotPosition, selectedTargetId, hotspotLabel, addHotspot]);

  const handleHotspotClick = useCallback(
    (targetSceneId: string) => {
      viewScene(targetSceneId);
    },
    [viewScene]
  );

  const handleDeleteHotspot = useCallback(
    (hotspotId: string) => {
      if (!viewingSceneId) return;
      deleteHotspot(viewingSceneId, hotspotId);
    },
    [viewingSceneId, deleteHotspot]
  );

  if (!viewingSceneId || !currentScene) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'var(--bg-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Header */}
        <motion.div
          className="absolute top-0 left-0 right-0 z-20 p-4"
          style={{
            background: 'linear-gradient(to bottom, rgba(10, 10, 14, 0.9), transparent)',
          }}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => {
                  cancelPlacement();
                  viewScene(null);
                }}
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-dark)',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-primary)"
                  strokeWidth="2"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <div>
                <h1
                  className="text-lg font-bold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {currentScene.name}
                </h1>
                <p className="text-xs" style={{ color: isPlacementMode ? '#00FF00' : 'var(--text-secondary)' }}>
                  {isPlacementMode ? 'Click anywhere to place hotspot' : 'Drag to look around'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isPlacementMode && (
                <motion.button
                  onClick={cancelPlacement}
                  className="px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    backgroundColor: 'rgba(255, 0, 128, 0.2)',
                    border: '1px solid var(--neon-pink)',
                    color: 'var(--neon-pink)',
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
              )}
              <motion.div
                className="px-3 py-1.5 rounded-lg flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-dark)',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--neon-blue)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {currentScene.hotspots.length} hotspot
                  {currentScene.hotspots.length !== 1 ? 's' : ''}
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Placement Mode Overlay */}
        <AnimatePresence>
          {isPlacementMode && (
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                border: '4px solid #00FF00',
                boxShadow: 'inset 0 0 50px rgba(0, 255, 0, 0.1)',
              }}
            />
          )}
        </AnimatePresence>

        {/* 3D Canvas */}
        <Suspense fallback={<LoadingScreen />}>
          <Canvas
            camera={{ fov: 85, position: [0, 0, 0.1] }}
            style={{ cursor: isPlacementMode ? 'crosshair' : 'grab' }}
          >
            <CameraController />
            {/* Render cube or sphere panorama based on panoramaType */}
            {currentScene.panoramaType === 'cube' && currentScene.cubeImages ? (
              <PanoramaCube
                cubeImages={currentScene.cubeImages}
                isPlacementMode={isPlacementMode}
                onPlaceHotspot={handlePlaceHotspot}
              />
            ) : (
              <PanoramaSphere
                imageUrl={currentScene.imageUrl}
                isPlacementMode={isPlacementMode}
                onPlaceHotspot={handlePlaceHotspot}
              />
            )}

            {/* Preview hotspot during placement */}
            {pendingHotspotPosition && (
              <HotspotMarker
                position={[pendingHotspotPosition.x, pendingHotspotPosition.y, pendingHotspotPosition.z]}
                label="New Hotspot"
                onClick={() => { }}
                onDelete={() => { }}
                isPreview
              />
            )}

            {/* Render existing Hotspots */}
            {currentScene.hotspots.map((hotspot) => {
              const targetScene = scenes.find((s) => s.id === hotspot.targetSceneId);
              return (
                <HotspotMarker
                  key={hotspot.id}
                  position={[hotspot.position.x, hotspot.position.y, hotspot.position.z]}
                  label={hotspot.label}
                  targetSceneName={targetScene?.name}
                  onClick={() => handleHotspotClick(hotspot.targetSceneId)}
                  onDelete={() => handleDeleteHotspot(hotspot.id)}
                />
              );
            })}

            <ambientLight intensity={0.5} />
          </Canvas>
        </Suspense>

        {/* Select Target Scene Modal - shown after placing hotspot */}
        <AnimatePresence>
          {pendingHotspotPosition && (
            <motion.div
              className="fixed inset-0 z-30 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(10, 10, 14, 0.8)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelPlacement}
            >
              <motion.div
                className="p-6 rounded-xl max-w-md w-full mx-4"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-dark)',
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: 'rgba(0, 255, 0, 0.2)',
                      border: '1px solid #00FF00',
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#00FF00"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h2
                      className="text-lg font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Location Selected
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Now choose the destination scene
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-xs mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Hotspot Label (optional)
                    </label>
                    <input
                      type="text"
                      value={hotspotLabel}
                      onChange={(e) => setHotspotLabel(e.target.value)}
                      placeholder="Enter hotspot label..."
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-dark)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-xs mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Link to Scene
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {scenes
                        .filter((s) => s.id !== viewingSceneId)
                        .map((scene) => (
                          <motion.button
                            key={scene.id}
                            onClick={() => setSelectedTargetId(scene.id)}
                            className="p-2 rounded-lg text-left"
                            style={{
                              backgroundColor:
                                selectedTargetId === scene.id
                                  ? 'var(--bg-tertiary)'
                                  : 'var(--bg-primary)',
                              border:
                                selectedTargetId === scene.id
                                  ? '1px solid var(--neon-blue)'
                                  : '1px solid var(--border-dark)',
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <img
                              src={scene.thumbnail || scene.imageUrl}
                              alt={scene.name}
                              className="w-full h-16 object-cover rounded mb-2"
                            />
                            <p
                              className="text-xs truncate"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {scene.name}
                            </p>
                          </motion.button>
                        ))}
                    </div>
                    {scenes.filter((s) => s.id !== viewingSceneId).length === 0 && (
                      <p
                        className="text-center py-4 text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        No other scenes available. Add more scenes first.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={cancelPlacement}
                    className="flex-1 py-2.5 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={confirmHotspot}
                    disabled={!selectedTargetId}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{
                      background: selectedTargetId
                        ? 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))'
                        : 'var(--bg-tertiary)',
                      color: selectedTargetId
                        ? 'var(--bg-primary)'
                        : 'var(--text-secondary)',
                    }}
                    whileHover={selectedTargetId ? { scale: 1.02 } : {}}
                    whileTap={selectedTargetId ? { scale: 0.98 } : {}}
                  >
                    Create Hotspot
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Controls */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 z-20 p-4"
          style={{
            background: 'linear-gradient(to top, rgba(10, 10, 14, 0.9), transparent)',
          }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-center gap-4 max-w-7xl mx-auto">
            {!isPlacementMode && !pendingHotspotPosition && (
              <motion.button
                onClick={startPlacementMode}
                className="px-6 py-3 rounded-lg font-medium text-sm flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                  color: 'var(--bg-primary)',
                }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 25px rgba(0, 240, 255, 0.5)',
                }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Add Hotspot
              </motion.button>
            )}
            {isPlacementMode && (
              <motion.div
                className="px-6 py-3 rounded-lg font-medium text-sm flex items-center gap-2"
                style={{
                  backgroundColor: 'rgba(0, 255, 0, 0.2)',
                  border: '2px solid #00FF00',
                  color: '#00FF00',
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  boxShadow: [
                    '0 0 10px rgba(0, 255, 0, 0.3)',
                    '0 0 20px rgba(0, 255, 0, 0.5)',
                    '0 0 10px rgba(0, 255, 0, 0.3)',
                  ]
                }}
                transition={{
                  boxShadow: { duration: 1.5, repeat: Infinity }
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                </svg>
                Click on panorama to place hotspot
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
