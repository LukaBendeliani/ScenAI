'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';

// Extend to register Line_ as a custom element
extend({ Line_: THREE.Line });

function Particles() {
  const particlesRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const particleCount = 500;

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const neonBlue = new THREE.Color('#00F0FF');
    const neonPink = new THREE.Color('#FF0080');

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 50;
      positions[i3 + 1] = (Math.random() - 0.5) * 50;
      positions[i3 + 2] = (Math.random() - 0.5) * 30;

      const color = Math.random() > 0.5 ? neonBlue : neonPink;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    return [positions, colors];
  }, []);

  useEffect(() => {
    if (geometryRef.current) {
      geometryRef.current.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
      geometryRef.current.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3)
      );
    }
  }, [positions, colors]);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const time = state.clock.elapsedTime;
    particlesRef.current.rotation.y = time * 0.02;
    particlesRef.current.rotation.x = Math.sin(time * 0.01) * 0.1;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry ref={geometryRef} />
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function GridFloor() {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((state) => {
    if (!gridRef.current) return;
    gridRef.current.position.z = (state.clock.elapsedTime * 0.5) % 2;
  });

  return (
    <group position={[0, -5, 0]}>
      <gridHelper
        ref={gridRef}
        args={[100, 50, '#303540', '#202430']}
      />
    </group>
  );
}

// Single line component using primitive
function AnimatedLine({ 
  geometry, 
  color, 
  speed, 
  index 
}: { 
  geometry: THREE.BufferGeometry; 
  color: string; 
  speed: number; 
  index: number;
}) {
  const lineRef = useRef<THREE.Line>(null);
  
  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({ 
      color, 
      transparent: true, 
      opacity: 0.3 
    });
  }, [color]);

  useFrame((state) => {
    if (!lineRef.current) return;
    lineRef.current.position.x = Math.sin(state.clock.elapsedTime * speed + index) * 0.5;
    lineRef.current.position.y = Math.cos(state.clock.elapsedTime * speed * 0.5 + index) * 0.3;
  });

  const line = useMemo(() => {
    return new THREE.Line(geometry, material);
  }, [geometry, material]);

  return <primitive ref={lineRef} object={line} />;
}

function FloatingLines() {
  const lineCount = 20;

  const lines = useMemo(() => {
    const result = [];
    for (let i = 0; i < lineCount; i++) {
      const startX = (Math.random() - 0.5) * 40;
      const startY = (Math.random() - 0.5) * 20;
      const startZ = (Math.random() - 0.5) * 20;
      
      const points = [
        new THREE.Vector3(startX, startY, startZ),
        new THREE.Vector3(
          startX + (Math.random() - 0.5) * 5,
          startY + (Math.random() - 0.5) * 5,
          startZ + (Math.random() - 0.5) * 5
        )
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      result.push({
        geometry,
        color: Math.random() > 0.5 ? '#00F0FF' : '#FF0080',
        speed: 0.5 + Math.random() * 0.5,
      });
    }
    return result;
  }, []);

  return (
    <group>
      {lines.map((line, i) => (
        <AnimatedLine 
          key={i} 
          geometry={line.geometry} 
          color={line.color} 
          speed={line.speed}
          index={i}
        />
      ))}
    </group>
  );
}

export default function AmbientBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.1} />
        <Particles />
        <GridFloor />
        <FloatingLines />
      </Canvas>
    </div>
  );
}
