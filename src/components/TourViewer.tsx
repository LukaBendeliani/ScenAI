'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import PanoramaCube from './PanoramaCube';

// --- Shared Components (Duplicated/Inlined for independence) ---

interface HotspotMarkerProps {
    position: [number, number, number];
    label?: string;
    onClick: () => void;
    targetSceneName?: string;
}

function HotspotMarker({ position, label, onClick, targetSceneName }: HotspotMarkerProps) {
    const [hovered, setHovered] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
            const scale = hovered ? 1.2 : 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
            meshRef.current.scale.setScalar(scale);
        }
    });

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onPointerOver={() => { setHovered(true); setShowTooltip(true); }}
                onPointerOut={() => { setHovered(false); setShowTooltip(false); }}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
            >
                <torusGeometry args={[0.3, 0.1, 16, 32]} />
                <meshStandardMaterial
                    color={hovered ? '#FF0080' : '#00F0FF'}
                    emissive={hovered ? '#FF0080' : '#00F0FF'}
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.9}
                />
            </mesh>
            <pointLight color={'#00F0FF'} intensity={1} distance={3} />

            {showTooltip && (
                <Html center distanceFactor={10}>
                    <div
                        className="px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none"
                        style={{
                            backgroundColor: 'rgba(21, 24, 32, 0.95)',
                            border: '1px solid var(--neon-blue)',
                            boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)',
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
                    </div>
                </Html>
            )}
        </group>
    );
}

interface PanoramaSphereProps {
    imageUrl: string;
}

function PanoramaSphere({ imageUrl }: PanoramaSphereProps) {
    const texture = useTexture(imageUrl);

    useEffect(() => {
        if (texture) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.repeat.x = -1;
            texture.needsUpdate = true;
        }
    }, [texture]);

    return (
        <mesh scale={[-1, 1, 1]}>
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
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black">
            <div className="w-16 h-16 rounded-full border-4 border-gray-800 border-t-cyan-500 animate-spin" />
        </div>
    );
}

import { useRef } from 'react';

// --- TourViewer Component ---

interface TourData {
    id: string;
    name: string;
    description?: string;
    editorState: {
        scenes: any[];
        nodes: any[];
        edges: any[];
    }
}

export default function TourViewer({ tour }: { tour: TourData }) {
    const { scenes } = tour.editorState;
    const [currentSceneId, setCurrentSceneId] = useState<string | null>(scenes[0]?.id || null);

    const currentScene = scenes.find(s => s.id === currentSceneId);

    const handleHotspotClick = (targetSceneId: string) => {
        if (scenes.find(s => s.id === targetSceneId)) {
            setCurrentSceneId(targetSceneId);
        }
    };

    if (!currentScene) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                <p>No scenes in this tour.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            {/* Scene Info Overlay */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/50 backdrop-blur-md p-4 rounded-xl border border-white/10"
                >
                    <h1 className="text-xl font-bold text-white mb-1">{tour.name}</h1>
                    <h2 className="text-lg text-cyan-400">{currentScene.name}</h2>
                    {tour.description && <p className="text-sm text-gray-400 mt-2 max-w-xs">{tour.description}</p>}
                </motion.div>
            </div>

            <Canvas camera={{ fov: 85, position: [0, 0, 0.1] }}>
                <Suspense fallback={<Html center><LoadingScreen /></Html>}>
                    <CameraController />

                    {currentScene.panoramaType === 'cube' && currentScene.cubeImages ? (
                        <PanoramaCube
                            cubeImages={currentScene.cubeImages}
                            isPlacementMode={false}
                            onPlaceHotspot={() => { }}
                        />
                    ) : (
                        <PanoramaSphere imageUrl={currentScene.imageUrl} />
                    )}

                    {currentScene.hotspots.map((hotspot: any) => {
                        const targetScene = scenes.find((s: any) => s.id === hotspot.targetSceneId);
                        return (
                            <HotspotMarker
                                key={hotspot.id}
                                position={[hotspot.position.x, hotspot.position.y, hotspot.position.z]}
                                label={hotspot.label}
                                targetSceneName={targetScene?.name}
                                onClick={() => handleHotspotClick(hotspot.targetSceneId)}
                            />
                        );
                    })}

                    <ambientLight intensity={0.5} />
                </Suspense>
            </Canvas>
        </div>
    );
}
