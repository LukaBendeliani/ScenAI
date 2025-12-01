'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTourContext, Tour } from '@/context/TourContext';
import { useSession, signOut } from 'next-auth/react';

interface TourSelectorProps {
  onClose: () => void;
}

export default function TourSelector({ onClose }: TourSelectorProps) {
  const { data: session } = useSession();
  const {
    tours,
    currentTourId,
    isLoading,
    error,
    createTour,
    selectTour,
    deleteTour,
    fetchTours,
  } = useTourContext();

  const [isCreating, setIsCreating] = useState(false);
  const [newTourName, setNewTourName] = useState('');
  const [newTourDescription, setNewTourDescription] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreateTour = async () => {
    if (!newTourName.trim()) return;
    
    const tourId = await createTour(newTourName, newTourDescription);
    if (tourId) {
      await selectTour(tourId);
      setIsCreating(false);
      setNewTourName('');
      setNewTourDescription('');
      onClose();
    }
  };

  const handleSelectTour = async (tourId: string) => {
    await selectTour(tourId);
    onClose();
  };

  const handleDeleteTour = async (tourId: string) => {
    await deleteTour(tourId);
    setDeleteConfirmId(null);
    if (currentTourId === tourId) {
      // Tour list will update, stay on selector
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(var(--neon-blue) 1px, transparent 1px),
            linear-gradient(90deg, var(--neon-blue) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-dark)',
          boxShadow: '0 0 100px rgba(0, 240, 255, 0.1)',
        }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div
          className="px-8 py-6 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-dark)' }}
        >
          <div className="flex items-center gap-4">
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
              }}
              animate={{
                boxShadow: [
                  '0 0 15px rgba(0, 240, 255, 0.3)',
                  '0 0 30px rgba(0, 240, 255, 0.5)',
                  '0 0 15px rgba(0, 240, 255, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </motion.div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Your Virtual Tours
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Select a tour to edit or create a new one
              </p>
            </div>
          </div>

          {/* User info & Sign out */}
          {session?.user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
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
                    {session.user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="hidden sm:block">
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {session.user.name || 'User'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {session.user.email}
                  </p>
                </div>
              </div>
              <motion.button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 rounded-lg text-sm font-medium"
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
                Sign Out
              </motion.button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg"
              style={{
                backgroundColor: 'rgba(255, 0, 128, 0.1)',
                border: '1px solid var(--neon-pink)',
                color: 'var(--neon-pink)',
              }}
            >
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
                <button
                  onClick={fetchTours}
                  className="ml-auto text-sm underline"
                >
                  Retry
                </button>
              </div>
            </motion.div>
          )}

          {/* Create new tour section */}
          <AnimatePresence mode="wait">
            {isCreating ? (
              <motion.div
                key="create-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-6 rounded-xl"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--neon-blue)',
                }}
              >
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Create New Tour
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-xs font-medium mb-2 uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Tour Name *
                    </label>
                    <input
                      type="text"
                      value={newTourName}
                      onChange={(e) => setNewTourName(e.target.value)}
                      placeholder="My Virtual Tour"
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-dark)',
                        color: 'var(--text-primary)',
                      }}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-2 uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Description (optional)
                    </label>
                    <textarea
                      value={newTourDescription}
                      onChange={(e) => setNewTourDescription(e.target.value)}
                      placeholder="A brief description of your tour..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-dark)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      onClick={handleCreateTour}
                      disabled={!newTourName.trim() || isLoading}
                      className="flex-1 py-3 rounded-lg font-medium text-sm disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                        color: 'var(--bg-primary)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? 'Creating...' : 'Create Tour'}
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setIsCreating(false);
                        setNewTourName('');
                        setNewTourDescription('');
                      }}
                      className="px-6 py-3 rounded-lg font-medium text-sm"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="create-button"
                onClick={() => setIsCreating(true)}
                className="w-full mb-8 py-6 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 group"
                style={{
                  borderColor: 'var(--border-dark)',
                  backgroundColor: 'transparent',
                }}
                whileHover={{
                  borderColor: 'var(--neon-blue)',
                  backgroundColor: 'rgba(0, 240, 255, 0.05)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--neon-blue)"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <div className="text-left">
                  <p
                    className="text-base font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Create New Tour
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Start building an immersive 360° experience
                  </p>
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Tours grid */}
          {isLoading && tours.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <motion.div
                className="w-12 h-12 border-3 rounded-full"
                style={{
                  borderColor: 'var(--border-dark)',
                  borderTopColor: 'var(--neon-blue)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          ) : tours.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-secondary)"
                  strokeWidth="1.5"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3
                className="text-lg font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                No tours yet
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Create your first virtual tour to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tours.map((tour: Tour, index: number) => (
                <motion.div
                  key={tour.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: currentTourId === tour.id ? '2px solid var(--neon-blue)' : '1px solid var(--border-dark)',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    className="relative h-32 overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    {tour.thumbnail ? (
                      <img
                        src={tour.thumbnail}
                        alt={tour.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--border-dark)"
                          strokeWidth="1.5"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <ellipse cx="12" cy="12" rx="10" ry="4" />
                          <line x1="12" y1="2" x2="12" y2="22" />
                        </svg>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div
                      className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: 'rgba(10, 10, 14, 0.8)' }}
                    >
                      <motion.button
                        onClick={() => handleSelectTour(tour.id)}
                        className="px-4 py-2 rounded-lg text-sm font-medium"
                        style={{
                          background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                          color: 'var(--bg-primary)',
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Open
                      </motion.button>
                      <motion.button
                        onClick={() => setDeleteConfirmId(tour.id)}
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-dark)',
                        }}
                        whileHover={{
                          borderColor: 'var(--neon-pink)',
                          backgroundColor: 'rgba(255, 0, 128, 0.2)',
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--neon-pink)"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3
                      className="font-medium truncate mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {tour.name}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Updated {new Date(tour.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Delete confirmation */}
                  <AnimatePresence>
                    {deleteConfirmId === tour.id && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center p-4"
                        style={{ backgroundColor: 'rgba(10, 10, 14, 0.95)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="text-center">
                          <p
                            className="text-sm mb-4"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Delete &quot;{tour.name}&quot;?
                          </p>
                          <div className="flex gap-2 justify-center">
                            <motion.button
                              onClick={() => handleDeleteTour(tour.id)}
                              className="px-4 py-2 rounded-lg text-sm font-medium"
                              style={{
                                backgroundColor: 'var(--neon-pink)',
                                color: 'white',
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Delete
                            </motion.button>
                            <motion.button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-4 py-2 rounded-lg text-sm font-medium"
                              style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Cancel
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with close button if there's a current tour */}
        {currentTourId && (
          <div
            className="px-8 py-4 flex justify-end"
            style={{ borderTop: '1px solid var(--border-dark)' }}
          >
            <motion.button
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Back to Editor
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

