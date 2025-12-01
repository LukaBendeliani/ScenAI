'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTourContext } from '@/context/TourContext';

interface SaveIndicatorProps {
  onSave: () => void;
}

export default function SaveIndicator({ onSave }: SaveIndicatorProps) {
  const { 
    currentTour,
    isSaving, 
    hasUnsavedChanges, 
    lastSaved,
    setIsTourSelectorOpen,
  } = useTourContext();

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
      {/* Tour name button */}
      <motion.button
        onClick={() => setIsTourSelectorOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-dark)',
          color: 'var(--text-primary)',
        }}
        whileHover={{
          borderColor: 'var(--neon-blue)',
          boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)',
        }}
        whileTap={{ scale: 0.98 }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--neon-blue)"
          strokeWidth="2"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <span className="max-w-32 truncate">{currentTour?.name || 'Tour'}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-secondary)"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </motion.button>

      {/* Save status */}
      <div
        className="flex items-center gap-3 px-4 py-2 rounded-lg"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-dark)',
        }}
      >
        <AnimatePresence mode="wait">
          {isSaving ? (
            <motion.div
              key="saving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <motion.div
                className="w-4 h-4 border-2 rounded-full"
                style={{
                  borderColor: 'var(--border-dark)',
                  borderTopColor: 'var(--neon-blue)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Saving...
              </span>
            </motion.div>
          ) : hasUnsavedChanges ? (
            <motion.div
              key="unsaved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--neon-pink)' }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Unsaved changes
              </span>
            </motion.div>
          ) : lastSaved ? (
            <motion.div
              key="saved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--neon-blue)"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Saved {formatLastSaved(lastSaved)}
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Manual save button */}
        <motion.button
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-40"
          style={{
            backgroundColor: hasUnsavedChanges ? 'var(--neon-blue)' : 'var(--bg-tertiary)',
            color: hasUnsavedChanges ? 'var(--bg-primary)' : 'var(--text-secondary)',
          }}
          whileHover={hasUnsavedChanges ? { scale: 1.05 } : {}}
          whileTap={hasUnsavedChanges ? { scale: 0.95 } : {}}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Save
        </motion.button>
      </div>

      {/* Keyboard shortcut hint */}
      <div
        className="hidden lg:flex items-center gap-1 text-xs"
        style={{ color: 'var(--text-secondary)' }}
      >
        <kbd
          className="px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-dark)',
          }}
        >
          ⌘
        </kbd>
        <span>+</span>
        <kbd
          className="px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-dark)',
          }}
        >
          S
        </kbd>
      </div>
    </div>
  );
}

