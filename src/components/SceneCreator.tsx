'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneContext } from '@/context/SceneContext';

// Prompt suggestions for AI generation
const PROMPT_SUGGESTIONS = [
  'A futuristic cyberpunk city at night with neon lights and flying cars',
  'A serene Japanese zen garden with cherry blossoms and a koi pond',
  'An ancient Egyptian temple interior with hieroglyphics and torches',
  'A cozy cabin interior during a snowstorm with a fireplace',
  'A vibrant coral reef underwater with tropical fish',
  'A mystical forest with bioluminescent plants and mushrooms',
];

const EXAMPLE_PANORAMAS = [
  {
    id: 'example-1',
    name: 'Mountain Vista',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2048&h=1024&fit=crop',
  },
  {
    id: 'example-2',
    name: 'Ocean Sunset',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=200&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2048&h=1024&fit=crop',
  },
  {
    id: 'example-3',
    name: 'City Lights',
    thumbnail: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=200&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=2048&h=1024&fit=crop',
  },
  {
    id: 'example-4',
    name: 'Forest Path',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=200&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=2048&h=1024&fit=crop',
  },
  {
    id: 'example-5',
    name: 'Desert Dunes',
    thumbnail: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=200&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=2048&h=1024&fit=crop',
  },
  {
    id: 'example-6',
    name: 'Northern Lights',
    thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=200&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=2048&h=1024&fit=crop',
  },
];

type TabType = 'upload' | 'examples' | 'generate';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.9, y: 20 },
};

export default function SceneCreator() {
  const { isCreatorOpen, closeCreator, addScene } = useSceneContext();
  const [activeTab, setActiveTab] = useState<TabType>('examples');
  const [sceneName, setSceneName] = useState('');
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!generatePrompt.trim()) return;
    
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: generatePrompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        throw new Error(data.error || 'No image generated');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      setGenerateError(error.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [generatePrompt]);

  const handleUseSuggestion = useCallback((suggestion: string) => {
    setGeneratePrompt(suggestion);
  }, []);

  const handleCreate = useCallback(() => {
    let imageUrl = '';
    let thumbnail = '';

    if (activeTab === 'examples' && selectedExample) {
      const example = EXAMPLE_PANORAMAS.find((e) => e.id === selectedExample);
      if (example) {
        imageUrl = example.imageUrl;
        thumbnail = example.thumbnail;
      }
    } else if (activeTab === 'upload' && uploadedImage) {
      imageUrl = uploadedImage;
      thumbnail = uploadedImage;
    } else if (activeTab === 'generate' && generatedImage) {
      imageUrl = generatedImage;
      thumbnail = generatedImage;
    }

    if (imageUrl && sceneName.trim()) {
      addScene({
        name: sceneName.trim(),
        imageUrl,
        thumbnail,
      });
      
      // Reset state
      setSceneName('');
      setSelectedExample(null);
      setUploadedImage(null);
      setGeneratedImage(null);
      setGeneratePrompt('');
      closeCreator();
    }
  }, [activeTab, selectedExample, uploadedImage, generatedImage, sceneName, addScene, closeCreator]);

  const canCreate = Boolean(
    sceneName.trim() &&
      ((activeTab === 'examples' && selectedExample) ||
        (activeTab === 'upload' && uploadedImage) ||
        (activeTab === 'generate' && generatedImage))
  );

  if (!isCreatorOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(10, 10, 14, 0.9)' }}
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={closeCreator}
      >
        <motion.div
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-dark)',
            boxShadow: '0 0 50px rgba(0, 240, 255, 0.1)',
          }}
          variants={modalVariants}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border-dark)' }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
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
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="2" />
                  <line x1="12" y1="8" x2="12" y2="16" stroke="white" strokeWidth="2" />
                  <line x1="8" y1="12" x2="16" y2="12" stroke="white" strokeWidth="2" />
                </svg>
              </motion.div>
              <div>
                <h2
                  className="text-lg font-bold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Add New Scene
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Create a new 360° panorama scene
                </p>
              </div>
            </div>
            <motion.button
              onClick={closeCreator}
              className="p-2 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-secondary)"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            {/* Scene Name Input */}
            <div className="mb-6">
              <label
                className="block text-xs font-medium mb-2 uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Scene Name
              </label>
              <input
                type="text"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                placeholder="Enter scene name..."
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-dark)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--neon-blue)';
                  e.target.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-dark)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Tabs */}
            <div
              className="flex gap-1 p-1 rounded-lg mb-6"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              {[
                { id: 'examples', label: 'Examples', icon: '🖼️' },
                { id: 'upload', label: 'Upload', icon: '📤' },
                { id: 'generate', label: 'AI Generate', icon: '✨' },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className="flex-1 py-2.5 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2"
                  style={{
                    backgroundColor:
                      activeTab === tab.id ? 'var(--bg-tertiary)' : 'transparent',
                    color:
                      activeTab === tab.id
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'examples' && (
                <motion.div
                  key="examples"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 gap-3"
                >
                  {EXAMPLE_PANORAMAS.map((example) => (
                    <motion.button
                      key={example.id}
                      onClick={() => setSelectedExample(example.id)}
                      className="relative rounded-lg overflow-hidden text-left group"
                      style={{
                        border:
                          selectedExample === example.id
                            ? '2px solid var(--neon-blue)'
                            : '1px solid var(--border-dark)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative h-28 overflow-hidden">
                        <img
                          src={example.thumbnail}
                          alt={example.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              'linear-gradient(to top, rgba(10, 10, 14, 0.8), transparent)',
                          }}
                        />
                        {selectedExample === example.id && (
                          <motion.div
                            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: 'var(--neon-blue)',
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--bg-primary)"
                              strokeWidth="3"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                      <div className="p-3">
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {example.name}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {activeTab === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {!uploadedImage ? (
                    <motion.button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-12 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3"
                      style={{
                        borderColor: 'var(--border-dark)',
                        backgroundColor: 'var(--bg-primary)',
                      }}
                      whileHover={{
                        borderColor: 'var(--neon-blue)',
                        boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)',
                      }}
                    >
                      <motion.div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                        }}
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--neon-blue)"
                          strokeWidth="2"
                        >
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                        </svg>
                      </motion.div>
                      <div className="text-center">
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Click to upload panorama
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          Supports JPG, PNG, WebP (max 10MB)
                        </p>
                      </div>
                    </motion.button>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative rounded-lg overflow-hidden">
                        <img
                          src={uploadedImage}
                          alt="Uploaded panorama"
                          className="w-full h-48 object-cover"
                        />
                        <motion.button
                          onClick={() => setUploadedImage(null)}
                          className="absolute top-2 right-2 p-2 rounded-lg"
                          style={{
                            backgroundColor: 'rgba(255, 0, 128, 0.8)',
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                          >
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </motion.button>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Image uploaded successfully
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'generate' && (
                <motion.div
                  key="generate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div>
                    <label
                      className="block text-xs font-medium mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Describe your panorama
                    </label>
                    <textarea
                      value={generatePrompt}
                      onChange={(e) => setGeneratePrompt(e.target.value)}
                      placeholder="A futuristic cyberpunk city at night with neon lights..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-dark)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Prompt Suggestions */}
                  <div>
                    <label
                      className="block text-xs font-medium mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Try a suggestion
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PROMPT_SUGGESTIONS.slice(0, 4).map((suggestion, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleUseSuggestion(suggestion)}
                          className="px-3 py-1.5 rounded-md text-xs"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-dark)',
                            color: 'var(--text-secondary)',
                          }}
                          whileHover={{
                            borderColor: 'var(--neon-blue)',
                            color: 'var(--neon-blue)',
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {suggestion.length > 30 ? suggestion.slice(0, 30) + '...' : suggestion}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <motion.button
                    onClick={handleGenerate}
                    disabled={!generatePrompt.trim() || isGenerating}
                    className="w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                      color: 'var(--bg-primary)',
                    }}
                    whileHover={!isGenerating ? { scale: 1.02 } : {}}
                    whileTap={!isGenerating ? { scale: 0.98 } : {}}
                  >
                    {isGenerating ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 rounded-full"
                          style={{
                            borderColor: 'transparent',
                            borderTopColor: 'var(--bg-primary)',
                          }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Generating with Gemini AI...
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        Generate with AI
                      </>
                    )}
                  </motion.button>

                  {/* Error Message */}
                  {generateError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg text-sm"
                      style={{
                        backgroundColor: 'rgba(255, 0, 128, 0.1)',
                        border: '1px solid var(--neon-pink)',
                        color: 'var(--neon-pink)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {generateError}
                      </div>
                    </motion.div>
                  )}

                  {/* Generated Image */}
                  {generatedImage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div
                        className="relative rounded-lg overflow-hidden"
                        style={{ border: '2px solid var(--neon-blue)' }}
                      >
                        <img
                          src={generatedImage}
                          alt="Generated panorama"
                          className="w-full h-48 object-cover"
                        />
                        <motion.div
                          className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs flex items-center gap-1"
                          style={{
                            backgroundColor: 'rgba(0, 240, 255, 0.2)',
                            border: '1px solid var(--neon-blue)',
                            color: 'var(--neon-blue)',
                          }}
                          animate={{
                            boxShadow: [
                              '0 0 5px rgba(0, 240, 255, 0.3)',
                              '0 0 10px rgba(0, 240, 255, 0.5)',
                              '0 0 5px rgba(0, 240, 255, 0.3)',
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          AI Generated
                        </motion.div>
                        <motion.button
                          onClick={() => {
                            setGeneratedImage(null);
                            setGenerateError(null);
                          }}
                          className="absolute top-2 left-2 p-1.5 rounded-md"
                          style={{
                            backgroundColor: 'rgba(255, 0, 128, 0.8)',
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                          >
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </motion.button>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        ✓ Image generated successfully! Click &quot;Create Scene&quot; to add it.
                      </p>
                    </motion.div>
                  )}

                  <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                    Powered by Google Gemini AI • Generation may take 10-30 seconds
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 flex gap-3"
            style={{ borderTop: '1px solid var(--border-dark)' }}
          >
            <motion.button
              onClick={closeCreator}
              className="flex-1 py-3 rounded-lg text-sm font-medium"
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
              onClick={handleCreate}
              disabled={!canCreate}
              className="flex-1 py-3 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: canCreate
                  ? 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))'
                  : 'var(--bg-tertiary)',
                color: canCreate ? 'var(--bg-primary)' : 'var(--text-secondary)',
              }}
              whileHover={canCreate ? { scale: 1.02, boxShadow: '0 0 25px rgba(0, 240, 255, 0.5)' } : {}}
              whileTap={canCreate ? { scale: 0.98 } : {}}
            >
              Create Scene
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

