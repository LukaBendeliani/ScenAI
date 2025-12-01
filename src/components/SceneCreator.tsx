'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneContext } from '@/context/SceneContext';
import { CUBE_FACES, CubeFaceId, CubeImages } from '@/types';
import { panoramaToCubemap } from '@/utils/panoramaToCubemap';

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

type CreationMode = 'upload' | 'examples' | 'generate' | 'assemble' | 'panorama-to-cubemap' | 'create-cubemap' | null;

interface UploadedAssembleImage {
  id: string;
  dataUrl: string;
  name: string;
}

interface AssemblyAnalysis {
  index: number;
  position: number;
  description: string;
}

// Type for partial cube face uploads
type PartialCubeImages = Partial<CubeImages>;

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
  const [activeMode, setActiveMode] = useState<CreationMode>(null);
  const [sceneName, setSceneName] = useState('');
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Assemble tab state
  const [assembleImages, setAssembleImages] = useState<UploadedAssembleImage[]>([]);
  const [isAssembling, setIsAssembling] = useState(false);
  const [assembledImage, setAssembledImage] = useState<string | null>(null);
  const [assembleError, setAssembleError] = useState<string | null>(null);
  const [assemblyProgress, setAssemblyProgress] = useState<string>('');
  const [assemblyAnalysis, setAssemblyAnalysis] = useState<AssemblyAnalysis[] | null>(null);
  const assembleInputRef = useRef<HTMLInputElement>(null);

  // Cubemap tab state
  const [cubeFaceImages, setCubeFaceImages] = useState<PartialCubeImages>({});
  const [activeFaceUpload, setActiveFaceUpload] = useState<CubeFaceId | null>(null);
  const cubeFaceInputRef = useRef<HTMLInputElement>(null);
  const [cubemapPanorama, setCubemapPanorama] = useState<string | null>(null);
  const [isConvertingToCubemap, setIsConvertingToCubemap] = useState(false);
  const [cubemapConversionProgress, setCubemapConversionProgress] = useState<string>('');
  const [cubemapError, setCubemapError] = useState<string | null>(null);
  const cubemapPanoramaInputRef = useRef<HTMLInputElement>(null);

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

  const handleAssembleFilesUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: UploadedAssembleImage[] = [];
    const fileArray = Array.from(files);

    fileArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newImages.push({
          id: `img-${Date.now()}-${index}`,
          dataUrl: event.target?.result as string,
          name: file.name,
        });

        // When all files are loaded, update state
        if (newImages.length === fileArray.length) {
          setAssembleImages((prev) => [...prev, ...newImages].slice(0, 12)); // Max 12 images
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset the input
    if (assembleInputRef.current) {
      assembleInputRef.current.value = '';
    }
  }, []);

  const handleRemoveAssembleImage = useCallback((id: string) => {
    setAssembleImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const handleReorderAssembleImages = useCallback((fromIndex: number, toIndex: number) => {
    setAssembleImages((prev) => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  }, []);

  const handleAssemble = useCallback(async () => {
    if (assembleImages.length < 2) return;

    setIsAssembling(true);
    setAssembleError(null);
    setAssembledImage(null);
    setAssemblyProgress('Analyzing images...');
    setAssemblyAnalysis(null);

    try {
      const response = await fetch('/api/assemble', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: assembleImages.map((img) => img.dataUrl),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assemble panorama');
      }

      if (data.success && data.imageUrl) {
        setAssembledImage(data.imageUrl);
        if (data.analysis) {
          setAssemblyAnalysis(data.analysis);
        }
        setAssemblyProgress('');
      } else {
        throw new Error(data.error || 'No panorama generated');
      }
    } catch (error: any) {
      console.error('Assembly error:', error);
      setAssembleError(error.message || 'Failed to assemble panorama. Please try again.');
      setAssemblyProgress('');
    } finally {
      setIsAssembling(false);
    }
  }, [assembleImages]);

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

  // Cubemap handlers
  const handleCubeFaceUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeFaceUpload) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCubeFaceImages((prev) => ({
          ...prev,
          [activeFaceUpload]: event.target?.result as string,
        }));
        setActiveFaceUpload(null);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (cubeFaceInputRef.current) {
      cubeFaceInputRef.current.value = '';
    }
  }, [activeFaceUpload]);

  const triggerCubeFaceUpload = useCallback((faceId: CubeFaceId) => {
    setActiveFaceUpload(faceId);
    setTimeout(() => {
      cubeFaceInputRef.current?.click();
    }, 0);
  }, []);

  const removeCubeFace = useCallback((faceId: CubeFaceId) => {
    setCubeFaceImages((prev) => {
      const newImages = { ...prev };
      delete newImages[faceId];
      return newImages;
    });
  }, []);

  const handleCubemapPanoramaUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCubemapPanorama(event.target?.result as string);
        setCubeFaceImages({}); // Clear any existing face images
      };
      reader.readAsDataURL(file);
    }
    if (cubemapPanoramaInputRef.current) {
      cubemapPanoramaInputRef.current.value = '';
    }
  }, []);

  const handleConvertPanoramaToCubemap = useCallback(async () => {
    if (!cubemapPanorama) return;

    setIsConvertingToCubemap(true);
    setCubemapError(null);
    setCubemapConversionProgress('Starting conversion...');

    try {
      const cubeImages = await panoramaToCubemap(cubemapPanorama, {
        faceSize: 1024,
        highQuality: true,
        onProgress: (progress, face) => {
          setCubemapConversionProgress(`Converting ${face} face... ${Math.round(progress)}%`);
        },
      });

      setCubeFaceImages(cubeImages);
      setCubemapConversionProgress('');
    } catch (error: any) {
      console.error('Cubemap conversion error:', error);
      setCubemapError(error.message || 'Failed to convert panorama to cubemap');
      setCubemapConversionProgress('');
    } finally {
      setIsConvertingToCubemap(false);
    }
  }, [cubemapPanorama]);

  // Check if all 6 cube faces are uploaded
  const allCubeFacesUploaded = CUBE_FACES.every((face) => cubeFaceImages[face.id]);
  const uploadedFacesCount = Object.keys(cubeFaceImages).length;

  const handleCreate = useCallback(() => {
    let imageUrl = '';
    let thumbnail = '';
    let panoramaType: 'sphere' | 'cube' = 'sphere';
    let cubeImages: CubeImages | undefined;

    if (activeMode === 'examples' && selectedExample) {
      const example = EXAMPLE_PANORAMAS.find((e) => e.id === selectedExample);
      if (example) {
        imageUrl = example.imageUrl;
        thumbnail = example.thumbnail;
      }
    } else if (activeMode === 'upload' && uploadedImage) {
      imageUrl = uploadedImage;
      thumbnail = uploadedImage;
    } else if (activeMode === 'generate' && generatedImage) {
      imageUrl = generatedImage;
      thumbnail = generatedImage;
    } else if (activeMode === 'assemble' && assembledImage) {
      imageUrl = assembledImage;
      thumbnail = assembledImage;
    } else if ((activeMode === 'panorama-to-cubemap' || activeMode === 'create-cubemap') && allCubeFacesUploaded) {
      // Create cubemap panorama
      panoramaType = 'cube';
      cubeImages = cubeFaceImages as CubeImages;
      // Use front face as thumbnail and imageUrl for display
      imageUrl = cubeFaceImages.front!;
      thumbnail = cubeFaceImages.front!;
    }

    if (imageUrl && sceneName.trim()) {
      addScene({
        name: sceneName.trim(),
        imageUrl,
        thumbnail,
        panoramaType,
        cubeImages,
      });
      
      // Reset state
      setSceneName('');
      setSelectedExample(null);
      setUploadedImage(null);
      setGeneratedImage(null);
      setGeneratePrompt('');
      setAssembleImages([]);
      setAssembledImage(null);
      setAssemblyAnalysis(null);
      setCubeFaceImages({});
      setCubemapPanorama(null);
      setCubemapError(null);
      setActiveMode(null);
      closeCreator();
    }
  }, [activeMode, selectedExample, uploadedImage, generatedImage, assembledImage, allCubeFacesUploaded, cubeFaceImages, sceneName, addScene, closeCreator]);

  const canCreate = Boolean(
    sceneName.trim() &&
      ((activeMode === 'examples' && selectedExample) ||
        (activeMode === 'upload' && uploadedImage) ||
        (activeMode === 'generate' && generatedImage) ||
        (activeMode === 'assemble' && assembledImage) ||
        ((activeMode === 'panorama-to-cubemap' || activeMode === 'create-cubemap') && allCubeFacesUploaded))
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
          className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl"
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

            {/* Mode Selection Buttons */}
            <AnimatePresence mode="wait">
              {activeMode === null && (
                <motion.div
                  key="mode-selection"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 gap-3"
                >
                  {[
                    { id: 'examples', label: 'Examples', icon: '🖼️', description: 'Choose from sample panoramas' },
                    { id: 'upload', label: 'Upload Panorama', icon: '📤', description: 'Upload your own 360° image' },
                    { id: 'generate', label: 'AI Generate', icon: '✨', description: 'Generate with Gemini AI' },
                    { id: 'assemble', label: 'Assemble', icon: '🧩', description: 'Stitch multiple images together' },
                    { id: 'panorama-to-cubemap', label: 'Panorama to Cubemap', icon: '🔄', description: 'Convert panorama to cube faces' },
                    { id: 'create-cubemap', label: 'Create Cubemap', icon: '🎲', description: 'Upload 6 cube face images' },
                  ].map((mode) => (
                    <motion.button
                      key={mode.id}
                      onClick={() => setActiveMode(mode.id as CreationMode)}
                      className="p-4 rounded-xl text-left group"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-dark)',
                      }}
                      whileHover={{
                        borderColor: 'var(--neon-blue)',
                        boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)',
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <motion.div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                          }}
                          whileHover={{
                            background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                          }}
                        >
                          {mode.icon}
                        </motion.div>
                        <div className="flex-1">
                          <p
                            className="text-sm font-medium mb-1"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {mode.label}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {mode.description}
                          </p>
                        </div>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--text-secondary)"
                          strokeWidth="2"
                          className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {/* Back Button when in a mode */}
              {activeMode !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4"
                >
                  <motion.button
                    onClick={() => setActiveMode(null)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-secondary)',
                    }}
                    whileHover={{
                      color: 'var(--neon-blue)',
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
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Back to options
                  </motion.button>
                </motion.div>
              )}

              {activeMode === 'examples' && (
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

              {activeMode === 'upload' && (
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

              {activeMode === 'generate' && (
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

              {activeMode === 'assemble' && (
                <motion.div
                  key="assemble"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Instructions */}
                  <div
                    className="p-3 rounded-lg text-xs"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-dark)',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🧩</span>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          Assemble multiple images into a 360° panorama
                        </p>
                        <p>
                          Upload 2-12 images taken around a point. AI will analyze their positions
                          and stitch them together into a seamless panorama.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Upload Area */}
                  <input
                    ref={assembleInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAssembleFilesUpload}
                    className="hidden"
                  />

                  {assembleImages.length === 0 ? (
                    <motion.button
                      onClick={() => assembleInputRef.current?.click()}
                      className="w-full py-10 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3"
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
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                        }}
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--neon-blue)"
                          strokeWidth="2"
                        >
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                      </motion.div>
                      <div className="text-center">
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Click to upload multiple images
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          Select 2-12 images to assemble
                        </p>
                      </div>
                    </motion.button>
                  ) : (
                    <div className="space-y-3">
                      {/* Image Grid */}
                      <div className="grid grid-cols-4 gap-2">
                        {assembleImages.map((image, index) => (
                          <motion.div
                            key={image.id}
                            className="relative group rounded-lg overflow-hidden aspect-square"
                            style={{
                              border: '1px solid var(--border-dark)',
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            layout
                          >
                            <img
                              src={image.dataUrl}
                              alt={image.name}
                              className="w-full h-full object-cover"
                            />
                            <div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{
                                background: 'rgba(10, 10, 14, 0.7)',
                              }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center gap-1">
                                {index > 0 && (
                                  <motion.button
                                    onClick={() => handleReorderAssembleImages(index, index - 1)}
                                    className="p-1 rounded"
                                    style={{
                                      backgroundColor: 'var(--bg-tertiary)',
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="var(--text-primary)"
                                      strokeWidth="2"
                                    >
                                      <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                  </motion.button>
                                )}
                                <motion.button
                                  onClick={() => handleRemoveAssembleImage(image.id)}
                                  className="p-1 rounded"
                                  style={{
                                    backgroundColor: 'var(--neon-pink)',
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
                                {index < assembleImages.length - 1 && (
                                  <motion.button
                                    onClick={() => handleReorderAssembleImages(index, index + 1)}
                                    className="p-1 rounded"
                                    style={{
                                      backgroundColor: 'var(--bg-tertiary)',
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="var(--text-primary)"
                                      strokeWidth="2"
                                    >
                                      <path d="M9 18l6-6-6-6" />
                                    </svg>
                                  </motion.button>
                                )}
                              </div>
                            </div>
                            <div
                              className="absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{
                                backgroundColor: 'var(--neon-blue)',
                                color: 'var(--bg-primary)',
                              }}
                            >
                              {index + 1}
                            </div>
                          </motion.div>
                        ))}

                        {/* Add More Button */}
                        {assembleImages.length < 12 && (
                          <motion.button
                            onClick={() => assembleInputRef.current?.click()}
                            className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center"
                            style={{
                              borderColor: 'var(--border-dark)',
                              backgroundColor: 'var(--bg-primary)',
                            }}
                            whileHover={{
                              borderColor: 'var(--neon-blue)',
                            }}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--text-secondary)"
                              strokeWidth="2"
                            >
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </motion.button>
                        )}
                      </div>

                      {/* Image Count */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {assembleImages.length} image{assembleImages.length !== 1 ? 's' : ''} selected
                          {assembleImages.length < 2 && ' (minimum 2 required)'}
                        </p>
                        <motion.button
                          onClick={() => {
                            setAssembleImages([]);
                            setAssembledImage(null);
                            setAssemblyAnalysis(null);
                          }}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            color: 'var(--neon-pink)',
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Clear all
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* Assemble Button */}
                  {assembleImages.length >= 2 && !assembledImage && (
                    <motion.button
                      onClick={handleAssemble}
                      disabled={isAssembling}
                      className="w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                        color: 'var(--bg-primary)',
                      }}
                      whileHover={!isAssembling ? { scale: 1.02 } : {}}
                      whileTap={!isAssembling ? { scale: 0.98 } : {}}
                    >
                      {isAssembling ? (
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
                          {assemblyProgress || 'Assembling panorama...'}
                        </>
                      ) : (
                        <>
                          <span>🧩</span>
                          Assemble Panorama with AI
                        </>
                      )}
                    </motion.button>
                  )}

                  {/* Error Message */}
                  {assembleError && (
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
                        {assembleError}
                      </div>
                    </motion.div>
                  )}

                  {/* Assembled Image Result */}
                  {assembledImage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div
                        className="relative rounded-lg overflow-hidden"
                        style={{ border: '2px solid var(--neon-blue)' }}
                      >
                        <img
                          src={assembledImage}
                          alt="Assembled panorama"
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
                          AI Assembled
                        </motion.div>
                        <motion.button
                          onClick={() => {
                            setAssembledImage(null);
                            setAssemblyAnalysis(null);
                            setAssembleError(null);
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

                      {/* Analysis Info */}
                      {assemblyAnalysis && (
                        <div
                          className="p-3 rounded-lg text-xs"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-dark)',
                          }}
                        >
                          <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                            Image Analysis:
                          </p>
                          <div className="space-y-1" style={{ color: 'var(--text-secondary)' }}>
                            {assemblyAnalysis.map((item, i) => (
                              <p key={i}>
                                Image {item.index + 1}: {item.position}° - {item.description}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        ✓ Panorama assembled successfully! Click &quot;Create Scene&quot; to add it.
                      </p>
                    </motion.div>
                  )}

                  <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                    Powered by Gemini 2.5 Flash • Analysis may take 15-45 seconds
                  </p>
                </motion.div>
              )}

              {activeMode === 'panorama-to-cubemap' && (
                <motion.div
                  key="panorama-to-cubemap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Hidden file inputs */}
                  <input
                    ref={cubemapPanoramaInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCubemapPanoramaUpload}
                    className="hidden"
                  />
                  <input
                    ref={cubeFaceInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCubeFaceUpload}
                    className="hidden"
                  />

                  {/* Instructions */}
                  <div
                    className="p-3 rounded-lg text-xs"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-dark)',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🔄</span>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          Panorama to Cubemap
                        </p>
                        <p>
                          Upload an equirectangular panorama image and convert it to 6 cube face images automatically.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Upload Panorama */}
                  {!cubemapPanorama && Object.keys(cubeFaceImages).length === 0 && (
                    <motion.button
                      onClick={() => cubemapPanoramaInputRef.current?.click()}
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
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
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
                          Upload an equirectangular 360° image
                        </p>
                      </div>
                    </motion.button>
                  )}

                  {/* Panorama Preview & Convert Button */}
                  {cubemapPanorama && Object.keys(cubeFaceImages).length === 0 && (
                    <div className="space-y-3">
                      <div className="relative rounded-lg overflow-hidden">
                        <img
                          src={cubemapPanorama}
                          alt="Panorama to convert"
                          className="w-full h-40 object-cover"
                        />
                        <motion.button
                          onClick={() => setCubemapPanorama(null)}
                          className="absolute top-2 right-2 p-2 rounded-lg"
                          style={{
                            backgroundColor: 'rgba(255, 0, 128, 0.8)',
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </motion.button>
                      </div>
                      <motion.button
                        onClick={handleConvertPanoramaToCubemap}
                        disabled={isConvertingToCubemap}
                        className="w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                          color: 'var(--bg-primary)',
                        }}
                        whileHover={!isConvertingToCubemap ? { scale: 1.02 } : {}}
                        whileTap={!isConvertingToCubemap ? { scale: 0.98 } : {}}
                      >
                        {isConvertingToCubemap ? (
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
                            {cubemapConversionProgress || 'Converting...'}
                          </>
                        ) : (
                          <>
                            <span>🔄</span>
                            Convert to Cubemap
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}

                  {/* Error Message */}
                  {cubemapError && (
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {cubemapError}
                      </div>
                    </motion.div>
                  )}

                  {/* Converted Cube Faces Preview */}
                  {Object.keys(cubeFaceImages).length > 0 && (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        {CUBE_FACES.map((face) => {
                          const hasImage = !!cubeFaceImages[face.id];
                          return (
                            <motion.div
                              key={face.id}
                              className="relative aspect-square rounded-lg overflow-hidden"
                              style={{
                                backgroundColor: 'var(--bg-primary)',
                                border: hasImage
                                  ? '2px solid var(--neon-blue)'
                                  : '2px dashed var(--border-dark)',
                              }}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: CUBE_FACES.indexOf(face) * 0.05 }}
                            >
                              {hasImage ? (
                                <>
                                  <img
                                    src={cubeFaceImages[face.id]}
                                    alt={face.label}
                                    className="w-full h-full object-cover"
                                  />
                                  <div
                                    className="absolute bottom-0 left-0 right-0 px-2 py-1 text-center"
                                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                                  >
                                    <span className="text-xs font-medium" style={{ color: 'var(--neon-blue)' }}>
                                      {face.icon} {face.label.split(' ')[0]}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                  <span className="text-2xl">{face.icon}</span>
                                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    {face.label.split(' ')[0]}
                                  </span>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Progress */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {uploadedFacesCount}/6 faces converted
                        </p>
                        <motion.button
                          onClick={() => {
                            setCubeFaceImages({});
                            setCubemapPanorama(null);
                          }}
                          className="text-xs px-2 py-1 rounded"
                          style={{ color: 'var(--neon-pink)' }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Start over
                        </motion.button>
                      </div>

                      {/* Progress Bar */}
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: allCubeFacesUploaded
                              ? 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))'
                              : 'var(--neon-blue)',
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(uploadedFacesCount / 6) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>

                      {/* Success Message */}
                      {allCubeFacesUploaded && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-lg text-sm flex items-center gap-2"
                          style={{
                            backgroundColor: 'rgba(0, 240, 255, 0.1)',
                            border: '1px solid var(--neon-blue)',
                            color: 'var(--neon-blue)',
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Conversion complete! Click &quot;Create Scene&quot; to add the cube panorama.
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {activeMode === 'create-cubemap' && (
                <motion.div
                  key="create-cubemap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Hidden file input */}
                  <input
                    ref={cubeFaceInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCubeFaceUpload}
                    className="hidden"
                  />

                  {/* Instructions */}
                  <div
                    className="p-3 rounded-lg text-xs"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-dark)',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🎲</span>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          Create Cubemap
                        </p>
                        <p>
                          Upload 6 individual images, one for each face of a skybox cube. Click on each face below to upload.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cube Face Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {CUBE_FACES.map((face) => {
                      const hasImage = !!cubeFaceImages[face.id];
                      return (
                        <motion.div
                          key={face.id}
                          className="relative aspect-square rounded-lg overflow-hidden"
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            border: hasImage
                              ? '2px solid var(--neon-blue)'
                              : '2px dashed var(--border-dark)',
                          }}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: CUBE_FACES.indexOf(face) * 0.05 }}
                        >
                          {hasImage ? (
                            <>
                              <img
                                src={cubeFaceImages[face.id]}
                                alt={face.label}
                                className="w-full h-full object-cover"
                              />
                              <motion.button
                                onClick={() => removeCubeFace(face.id)}
                                className="absolute top-1 right-1 p-1 rounded"
                                style={{ backgroundColor: 'rgba(255, 0, 128, 0.8)' }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              </motion.button>
                              <div
                                className="absolute bottom-0 left-0 right-0 px-2 py-1 text-center"
                                style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                              >
                                <span className="text-xs font-medium" style={{ color: 'var(--neon-blue)' }}>
                                  {face.icon} {face.label.split(' ')[0]}
                                </span>
                              </div>
                            </>
                          ) : (
                            <motion.button
                              onClick={() => triggerCubeFaceUpload(face.id)}
                              className="w-full h-full flex flex-col items-center justify-center gap-1"
                              whileHover={{ backgroundColor: 'rgba(0, 240, 255, 0.05)' }}
                            >
                              <span className="text-2xl">{face.icon}</span>
                              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {face.label.split(' ')[0]}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                                Click to upload
                              </span>
                            </motion.button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Progress */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {uploadedFacesCount}/6 faces uploaded
                    </p>
                    {uploadedFacesCount > 0 && (
                      <motion.button
                        onClick={() => {
                          setCubeFaceImages({});
                        }}
                        className="text-xs px-2 py-1 rounded"
                        style={{ color: 'var(--neon-pink)' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Clear all
                      </motion.button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: allCubeFacesUploaded
                          ? 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))'
                          : 'var(--neon-blue)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(uploadedFacesCount / 6) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Success Message */}
                  {allCubeFacesUploaded && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg text-sm flex items-center gap-2"
                      style={{
                        backgroundColor: 'rgba(0, 240, 255, 0.1)',
                        border: '1px solid var(--neon-blue)',
                        color: 'var(--neon-blue)',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      All 6 faces uploaded! Click &quot;Create Scene&quot; to add the cube panorama.
                    </motion.div>
                  )}

                  {/* Cube Layout Diagram */}
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-dark)',
                    }}
                  >
                    <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Cube unfolded layout:
                    </p>
                    <div className="flex justify-center">
                      <div className="grid grid-cols-4 gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <div className="w-8 h-8" />
                        <div
                          className="w-8 h-8 flex items-center justify-center rounded"
                          style={{
                            backgroundColor: cubeFaceImages.top ? 'var(--neon-blue)' : 'var(--bg-tertiary)',
                            color: cubeFaceImages.top ? 'var(--bg-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          ↑
                        </div>
                        <div className="w-8 h-8" />
                        <div className="w-8 h-8" />

                        <div
                          className="w-8 h-8 flex items-center justify-center rounded"
                          style={{
                            backgroundColor: cubeFaceImages.left ? 'var(--neon-blue)' : 'var(--bg-tertiary)',
                            color: cubeFaceImages.left ? 'var(--bg-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          ←
                        </div>
                        <div
                          className="w-8 h-8 flex items-center justify-center rounded"
                          style={{
                            backgroundColor: cubeFaceImages.front ? 'var(--neon-blue)' : 'var(--bg-tertiary)',
                            color: cubeFaceImages.front ? 'var(--bg-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          ◉
                        </div>
                        <div
                          className="w-8 h-8 flex items-center justify-center rounded"
                          style={{
                            backgroundColor: cubeFaceImages.right ? 'var(--neon-blue)' : 'var(--bg-tertiary)',
                            color: cubeFaceImages.right ? 'var(--bg-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          →
                        </div>
                        <div
                          className="w-8 h-8 flex items-center justify-center rounded"
                          style={{
                            backgroundColor: cubeFaceImages.back ? 'var(--neon-blue)' : 'var(--bg-tertiary)',
                            color: cubeFaceImages.back ? 'var(--bg-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          ○
                        </div>

                        <div className="w-8 h-8" />
                        <div
                          className="w-8 h-8 flex items-center justify-center rounded"
                          style={{
                            backgroundColor: cubeFaceImages.bottom ? 'var(--neon-blue)' : 'var(--bg-tertiary)',
                            color: cubeFaceImages.bottom ? 'var(--bg-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          ↓
                        </div>
                        <div className="w-8 h-8" />
                        <div className="w-8 h-8" />
                      </div>
                    </div>
                  </div>
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
