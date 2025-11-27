'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Connection,
  addEdge,
  useReactFlow,
  Panel,
  NodeChange,
  applyNodeChanges,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneContext } from '@/context/SceneContext';
import SceneNode from './SceneNode';
import AmbientBackground from './AmbientBackground';
import { SceneNode as SceneNodeType } from '@/types';

const nodeTypes = {
  scene: SceneNode,
};

export default function SceneEditor() {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    selectedSceneId,
    selectScene,
    openCreator,
  } = useSceneContext();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  // Handle connection
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        source: params.source || '',
        target: params.target || '',
        animated: true,
        style: { stroke: '#00F0FF', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      selectScene(node.id);
    },
    [selectScene]
  );

  // Handle pane click
  const onPaneClick = useCallback(() => {
    selectScene(null);
  }, [selectScene]);

  // Handle node drag
  const onNodesChange = useCallback(
    (changes: NodeChange<SceneNodeType>[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds) as SceneNodeType[]);
    },
    [setNodes]
  );

  // Custom edge style
  const defaultEdgeOptions = useMemo(
    () => ({
      style: { stroke: '#00F0FF', strokeWidth: 2 },
      animated: false,
    }),
    []
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="relative w-full h-full"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Ambient 3D Background */}
      <AmbientBackground />

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-right"
        className="z-10"
        style={{ background: 'transparent' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={30}
          size={1}
          color="var(--border-dark)"
          style={{ opacity: 0.5 }}
        />
        <Controls
          className="bg-bg-secondary! border-border-dark!"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.id === selectedSceneId) return '#00F0FF';
            return '#303540';
          }}
          maskColor="rgba(10, 10, 14, 0.8)"
          className="bg-bg-secondary! border-border-dark!"
        />

        {/* Custom Panel - Quick Actions */}
        <Panel position="top-right" className="flex gap-2">
          <motion.button
            onClick={() => fitView({ duration: 300, padding: 0.2 })}
            className="p-2.5 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-dark)',
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
            }}
            whileTap={{ scale: 0.95 }}
            title="Fit View"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-primary)"
              strokeWidth="2"
            >
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </motion.button>
          <motion.button
            onClick={openCreator}
            className="px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium text-sm"
            style={{
              background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
              color: 'var(--bg-primary)',
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
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
            Add Scene
          </motion.button>
        </Panel>

        {/* Info Panel */}
        <Panel position="bottom-left" className='absolute left-10!'>
          <motion.div
            className="p-3 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-dark)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--neon-blue)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {nodes.length} scenes
                </span>
              </div>
              <div
                className="w-px h-4"
                style={{ backgroundColor: 'var(--border-dark)' }}
              />
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--neon-pink)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {edges.length} connections
                </span>
              </div>
            </div>
          </motion.div>
        </Panel>
      </ReactFlow>

      {/* Empty State */}
      <AnimatePresence>
        {nodes.length === 0 && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center p-8 rounded-2xl max-w-md"
              style={{
                backgroundColor: 'rgba(21, 24, 32, 0.9)',
                border: '1px solid var(--border-dark)',
                backdropFilter: 'blur(10px)',
              }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                }}
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(0, 240, 255, 0.3)',
                    '0 0 40px rgba(0, 240, 255, 0.5)',
                    '0 0 20px rgba(0, 240, 255, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="white" />
                  <line x1="12" y1="2" x2="12" y2="5" stroke="white" strokeWidth="2" />
                  <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="2" />
                  <line x1="2" y1="12" x2="5" y2="12" stroke="white" strokeWidth="2" />
                  <line x1="19" y1="12" x2="22" y2="12" stroke="white" strokeWidth="2" />
                </svg>
              </motion.div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Start Your Virtual Tour
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Add your first 360° scene to begin creating an immersive experience.
                Connect scenes with hotspots to build interactive navigation.
              </p>
              <motion.button
                onClick={openCreator}
                className="px-6 py-3 rounded-lg font-medium"
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
                Add Your First Scene
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
