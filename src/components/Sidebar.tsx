'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { useSceneContext } from '@/context/SceneContext';
import { useTourContext } from '@/context/TourContext';
import { useRouter } from 'next/navigation';

const sidebarVariants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
  closed: {
    x: -300,
    opacity: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
  }),
};

export default function Sidebar() {
  const { data: session } = useSession();
  const { setIsTourSelectorOpen } = useTourContext();
  const {
    scenes,
    selectedSceneId,
    isSidebarOpen,
    selectScene,
    viewScene,
    deleteScene,
    openCreator,
    toggleSidebar,
  } = useSceneContext();
  const router = useRouter();

  return (
    <>
      {/* Mobile Toggle Button */}
      <motion.button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden p-3 rounded-lg"
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
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isSidebarOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Mobile Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-30 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
            />

            {/* Sidebar Panel */}
            <motion.aside
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed md:relative left-0 top-0 h-full w-72 z-40 flex flex-col"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-dark)',
              }}
            >
              {/* Header */}
              <div
                className="p-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--border-dark)' }}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 10px rgba(0, 240, 255, 0.3)',
                        '0 0 20px rgba(0, 240, 255, 0.5)',
                        '0 0 10px rgba(0, 240, 255, 0.3)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    onClick={() => router.push('/dashboard')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="2" />
                      <circle cx="12" cy="12" r="3" fill="white" />
                    </svg>
                  </motion.div>
                  <div>
                    <h1
                      className="text-sm font-semibold tracking-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      SceneAI
                    </h1>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Scene Editor
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="hidden md:block p-1 rounded hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 19l-7-7 7-7M4 12h16" />
                  </svg>
                </button>
              </div>

              {/* Scene List */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Scenes ({scenes.length})
                  </span>
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {scenes.map((scene, index) => (
                      <motion.div
                        key={scene.id}
                        custom={index}
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => selectScene(scene.id)}
                        className="group relative rounded-lg overflow-hidden cursor-pointer"
                        style={{
                          backgroundColor:
                            selectedSceneId === scene.id
                              ? 'var(--bg-tertiary)'
                              : 'var(--bg-primary)',
                          border:
                            selectedSceneId === scene.id
                              ? '1px solid var(--neon-blue)'
                              : '1px solid var(--border-dark)',
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Thumbnail */}
                        <div className="relative h-24 overflow-hidden">
                          <img
                            src={scene.thumbnail || scene.imageUrl}
                            alt={scene.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div
                            className="absolute inset-0"
                            style={{
                              background:
                                'linear-gradient(to top, rgba(10, 10, 14, 0.9), transparent)',
                            }}
                          />

                          {/* Action Buttons */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                viewScene(scene.id);
                              }}
                              className="p-1.5 rounded-md"
                              style={{
                                backgroundColor: 'rgba(0, 240, 255, 0.2)',
                                border: '1px solid var(--neon-blue)',
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="var(--neon-blue)"
                                strokeWidth="2"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polygon points="10,8 16,12 10,16" fill="var(--neon-blue)" />
                              </svg>
                            </motion.button>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteScene(scene.id);
                              }}
                              className="p-1.5 rounded-md"
                              style={{
                                backgroundColor: 'rgba(255, 0, 128, 0.2)',
                                border: '1px solid var(--neon-pink)',
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="var(--neon-pink)"
                                strokeWidth="2"
                              >
                                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                              </svg>
                            </motion.button>
                          </div>

                          {/* Hotspot Count Badge */}
                          {scene.hotspots.length > 0 && (
                            <div
                              className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-xs"
                              style={{
                                backgroundColor: 'rgba(0, 240, 255, 0.2)',
                                border: '1px solid var(--neon-blue)',
                                color: 'var(--neon-blue)',
                              }}
                            >
                              {scene.hotspots.length} hotspot
                              {scene.hotspots.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-3">
                          <h3
                            className="text-sm font-medium truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {scene.name}
                          </h3>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(scene.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Selection Indicator */}
                        {selectedSceneId === scene.id && (
                          <motion.div
                            className="absolute left-0 top-0 bottom-0 w-1"
                            style={{ backgroundColor: 'var(--neon-blue)' }}
                            layoutId="selectedIndicator"
                          />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Add Scene Button */}
              <div className="p-3" style={{ borderTop: '1px solid var(--border-dark)' }}>
                <motion.button
                  onClick={openCreator}
                  className="w-full py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                    color: 'var(--bg-primary)',
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
                  }}
                  whileTap={{ scale: 0.98 }}
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
                  Add New Scene
                </motion.button>
              </div>

              {/* Switch Tour Button */}
              <div className="p-3" style={{ borderTop: '1px solid var(--border-dark)' }}>
                <motion.button
                  onClick={() => setIsTourSelectorOpen(true)}
                  className="w-full py-2.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-dark)',
                    color: 'var(--text-primary)',
                  }}
                  whileHover={{
                    borderColor: 'var(--neon-blue)',
                    boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  Switch Tour
                </motion.button>
              </div>

              {/* User Profile Section */}
              {session?.user && (
                <div
                  className="p-3"
                  style={{ borderTop: '1px solid var(--border-dark)' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="w-10 h-10 rounded-full"
                        style={{ border: '2px solid var(--border-dark)' }}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                          color: 'var(--bg-primary)',
                        }}
                      >
                        {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {session.user.name || 'User'}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-dark)',
                      color: 'var(--text-secondary)',
                    }}
                    whileHover={{
                      borderColor: 'var(--neon-pink)',
                      color: 'var(--neon-pink)',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </motion.button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Collapsed Sidebar Toggle (Desktop) */}
      {!isSidebarOpen && (
        <motion.button
          onClick={toggleSidebar}
          className="hidden md:flex fixed left-4 top-4 z-40 p-3 rounded-lg items-center justify-center"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-dark)',
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{
            scale: 1.05,
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
          }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--neon-blue)"
            strokeWidth="2"
          >
            <path d="M13 5l7 7-7 7M20 12H4" />
          </svg>
        </motion.button>
      )}
    </>
  );
}

