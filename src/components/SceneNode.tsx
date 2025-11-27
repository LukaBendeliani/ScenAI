'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { type SceneNodeData, type Hotspot } from '@/types';
import { useSceneContext } from '@/context/SceneContext';

function SceneNodeComponent({ data, selected }: NodeProps) {
  const { viewScene, deleteScene } = useSceneContext();
  const nodeData = data as SceneNodeData;
  const scene = nodeData.scene;

  return (
    <motion.div
      className="relative rounded-xl overflow-hidden cursor-pointer"
      style={{
        width: 280,
        backgroundColor: 'var(--bg-secondary)',
        border: selected ? '2px solid var(--neon-blue)' : '1px solid var(--border-dark)',
        boxShadow: selected
          ? '0 0 20px rgba(0, 240, 255, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4)'
          : '0 4px 16px rgba(0, 0, 0, 0.3)',
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 0 25px rgba(0, 240, 255, 0.2), 0 12px 40px rgba(0, 0, 0, 0.5)',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 14,
          height: 14,
          background: 'var(--neon-pink)',
          border: '2px solid var(--bg-primary)',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 14,
          height: 14,
          background: 'var(--neon-blue)',
          border: '2px solid var(--bg-primary)',
        }}
      />

      {/* Thumbnail */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={scene.thumbnail || scene.imageUrl}
          alt={scene.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, var(--bg-secondary), transparent 50%)',
          }}
        />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <motion.div
            className="px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid var(--neon-blue)',
              color: 'var(--neon-blue)',
            }}
            animate={{
              boxShadow: [
                '0 0 5px rgba(0, 240, 255, 0.2)',
                '0 0 10px rgba(0, 240, 255, 0.4)',
                '0 0 5px rgba(0, 240, 255, 0.2)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            360°
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              viewScene(scene.id);
            }}
            className="p-2 rounded-lg"
            style={{
              backgroundColor: 'rgba(0, 240, 255, 0.2)',
              border: '1px solid var(--neon-blue)',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--neon-blue)"
              strokeWidth="2"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              deleteScene(scene.id);
            }}
            className="p-2 rounded-lg"
            style={{
              backgroundColor: 'rgba(255, 0, 128, 0.2)',
              border: '1px solid var(--neon-pink)',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--neon-pink)"
              strokeWidth="2"
            >
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4">
        <h3
          className="text-sm font-semibold tracking-tight truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {scene.name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {new Date(scene.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
          <div className="flex items-center gap-1.5">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-secondary)"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {scene.hotspots.length} hotspot{scene.hotspots.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Connections Preview */}
        {scene.hotspots.length > 0 && (
          <div
            className="mt-3 pt-3 flex flex-wrap gap-1"
            style={{ borderTop: '1px solid var(--border-dark)' }}
          >
            {scene.hotspots.slice(0, 3).map((hotspot: Hotspot) => (
              <span
                key={hotspot.id}
                className="px-2 py-0.5 rounded text-xs"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                }}
              >
                → {hotspot.label || 'Link'}
              </span>
            ))}
            {scene.hotspots.length > 3 && (
              <span
                className="px-2 py-0.5 rounded text-xs"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--neon-blue)',
                }}
              >
                +{scene.hotspots.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Selected Glow Effect */}
      {selected && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px solid var(--neon-blue)',
            borderRadius: 'inherit',
          }}
          animate={{
            boxShadow: [
              '0 0 10px rgba(0, 240, 255, 0.3), inset 0 0 20px rgba(0, 240, 255, 0.1)',
              '0 0 20px rgba(0, 240, 255, 0.5), inset 0 0 30px rgba(0, 240, 255, 0.15)',
              '0 0 10px rgba(0, 240, 255, 0.3), inset 0 0 20px rgba(0, 240, 255, 0.1)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

export default memo(SceneNodeComponent);
