/**
 * Panorama to Cubemap Converter
 * Based on https://github.com/jaxry/panorama-to-cubemap
 * 
 * Converts an equirectangular panorama image to six cube face images
 * using canvas manipulation and proper spherical projection math.
 */

import { CubeImages, CubeFaceId } from '@/types';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// Cube face orientations for proper projection
const FACE_ORIENTATIONS: Record<CubeFaceId, { 
  getValue: (x: number, y: number) => Vec3 
}> = {
  front: {
    getValue: (x, y) => ({ x: -1, y: -y, z: -x }),
  },
  back: {
    getValue: (x, y) => ({ x: 1, y: -y, z: x }),
  },
  left: {
    getValue: (x, y) => ({ x: -x, y: -y, z: 1 }),
  },
  right: {
    getValue: (x, y) => ({ x: x, y: -y, z: -1 }),
  },
  top: {
    getValue: (x, y) => ({ x: -y, y: 1, z: -x }),
  },
  bottom: {
    getValue: (x, y) => ({ x: y, y: -1, z: -x }),
  },
};

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Modulo operation that handles negative numbers correctly
 */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * Lanczos kernel for high-quality interpolation
 */
function lanczosKernel(x: number, a: number = 3): number {
  if (x === 0) return 1;
  if (Math.abs(x) >= a) return 0;
  const piX = Math.PI * x;
  return (a * Math.sin(piX) * Math.sin(piX / a)) / (piX * piX);
}

/**
 * Sample a pixel from the source image with Lanczos interpolation
 */
function sampleWithLanczos(
  sourceData: ImageData,
  x: number,
  y: number,
  kernelSize: number = 3
): [number, number, number, number] {
  const { width, height, data } = sourceData;
  
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  
  let r = 0, g = 0, b = 0, a = 0;
  let weightSum = 0;
  
  for (let j = -kernelSize + 1; j <= kernelSize; j++) {
    for (let i = -kernelSize + 1; i <= kernelSize; i++) {
      const sx = mod(x0 + i, width);
      const sy = clamp(y0 + j, 0, height - 1);
      
      const weight = lanczosKernel(x - (x0 + i), kernelSize) * 
                     lanczosKernel(y - (y0 + j), kernelSize);
      
      const idx = (sy * width + sx) * 4;
      r += data[idx] * weight;
      g += data[idx + 1] * weight;
      b += data[idx + 2] * weight;
      a += data[idx + 3] * weight;
      weightSum += weight;
    }
  }
  
  if (weightSum > 0) {
    r /= weightSum;
    g /= weightSum;
    b /= weightSum;
    a /= weightSum;
  }
  
  return [
    clamp(Math.round(r), 0, 255),
    clamp(Math.round(g), 0, 255),
    clamp(Math.round(b), 0, 255),
    clamp(Math.round(a), 0, 255),
  ];
}

/**
 * Sample a pixel using bilinear interpolation (faster but lower quality)
 */
function sampleBilinear(
  sourceData: ImageData,
  x: number,
  y: number
): [number, number, number, number] {
  const { width, height, data } = sourceData;
  
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = mod(x0 + 1, width);
  const y1 = Math.min(y0 + 1, height - 1);
  
  const fx = x - x0;
  const fy = y - y0;
  
  const sx0 = mod(x0, width);
  const sy0 = clamp(y0, 0, height - 1);
  
  const idx00 = (sy0 * width + sx0) * 4;
  const idx10 = (sy0 * width + x1) * 4;
  const idx01 = (y1 * width + sx0) * 4;
  const idx11 = (y1 * width + x1) * 4;
  
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  
  const r = lerp(
    lerp(data[idx00], data[idx10], fx),
    lerp(data[idx01], data[idx11], fx),
    fy
  );
  const g = lerp(
    lerp(data[idx00 + 1], data[idx10 + 1], fx),
    lerp(data[idx01 + 1], data[idx11 + 1], fx),
    fy
  );
  const b_ = lerp(
    lerp(data[idx00 + 2], data[idx10 + 2], fx),
    lerp(data[idx01 + 2], data[idx11 + 2], fx),
    fy
  );
  const a = lerp(
    lerp(data[idx00 + 3], data[idx10 + 3], fx),
    lerp(data[idx01 + 3], data[idx11 + 3], fx),
    fy
  );
  
  return [Math.round(r), Math.round(g), Math.round(b_), Math.round(a)];
}

/**
 * Convert a 3D direction vector to equirectangular UV coordinates
 */
function directionToEquirectangular(dir: Vec3): { u: number; v: number } {
  // Normalize the direction vector
  const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
  const nx = dir.x / len;
  const ny = dir.y / len;
  const nz = dir.z / len;
  
  // Convert to spherical coordinates
  // Longitude: atan2(z, x), range [-PI, PI]
  // Latitude: asin(y), range [-PI/2, PI/2]
  const longitude = Math.atan2(nz, nx);
  const latitude = Math.asin(clamp(ny, -1, 1));
  
  // Convert to UV coordinates [0, 1]
  const u = (longitude + Math.PI) / (2 * Math.PI);
  const v = (latitude + Math.PI / 2) / Math.PI;
  
  return { u, v };
}

/**
 * Render a single cube face from the equirectangular panorama
 */
function renderCubeFace(
  sourceData: ImageData,
  faceId: CubeFaceId,
  faceSize: number,
  useHighQuality: boolean = true
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = faceSize;
  canvas.height = faceSize;
  const ctx = canvas.getContext('2d')!;
  const targetData = ctx.createImageData(faceSize, faceSize);
  
  const orientation = FACE_ORIENTATIONS[faceId];
  const sampleFn = useHighQuality ? sampleWithLanczos : sampleBilinear;
  
  for (let y = 0; y < faceSize; y++) {
    for (let x = 0; x < faceSize; x++) {
      // Convert pixel coordinates to [-1, 1] range
      const nx = (2 * (x + 0.5)) / faceSize - 1;
      const ny = (2 * (y + 0.5)) / faceSize - 1;
      
      // Get the 3D direction for this pixel on the cube face
      const dir = orientation.getValue(nx, ny);
      
      // Convert to equirectangular coordinates
      const { u, v } = directionToEquirectangular(dir);
      
      // Sample from source image
      const srcX = u * sourceData.width;
      const srcY = (1 - v) * sourceData.height;
      
      const [r, g, b, a] = sampleFn(sourceData, srcX, srcY);
      
      // Write to target
      const idx = (y * faceSize + x) * 4;
      targetData.data[idx] = r;
      targetData.data[idx + 1] = g;
      targetData.data[idx + 2] = b;
      targetData.data[idx + 3] = a;
    }
  }
  
  return targetData;
}

/**
 * Convert ImageData to a data URL
 */
function imageDataToDataUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Load an image from a URL and return its ImageData
 */
export function loadImage(src: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Options for panorama to cubemap conversion
 */
export interface ConversionOptions {
  /** Size of each cube face in pixels (default: 1024) */
  faceSize?: number;
  /** Use Lanczos interpolation for higher quality (default: true) */
  highQuality?: boolean;
  /** Progress callback */
  onProgress?: (progress: number, face: CubeFaceId) => void;
}

/**
 * Convert an equirectangular panorama image to cubemap faces
 * 
 * @param panoramaUrl - URL or data URL of the equirectangular panorama
 * @param options - Conversion options
 * @returns Promise<CubeImages> - Object containing data URLs for each cube face
 */
export async function panoramaToCubemap(
  panoramaUrl: string,
  options: ConversionOptions = {}
): Promise<CubeImages> {
  const {
    faceSize = 1024,
    highQuality = true,
    onProgress,
  } = options;
  
  // Load the panorama image
  const sourceData = await loadImage(panoramaUrl);
  
  const faces: CubeFaceId[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];
  const result: Partial<CubeImages> = {};
  
  for (let i = 0; i < faces.length; i++) {
    const faceId = faces[i];
    
    if (onProgress) {
      onProgress((i / faces.length) * 100, faceId);
    }
    
    // Render the face (use setTimeout to allow UI updates)
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        const faceData = renderCubeFace(sourceData, faceId, faceSize, highQuality);
        result[faceId] = imageDataToDataUrl(faceData);
        resolve();
      }, 0);
    });
  }
  
  if (onProgress) {
    onProgress(100, 'front');
  }
  
  return result as CubeImages;
}

/**
 * Validate that all cube face images are present and valid
 */
export function validateCubeImages(images: Partial<CubeImages>): images is CubeImages {
  const requiredFaces: CubeFaceId[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];
  return requiredFaces.every((face) => typeof images[face] === 'string' && images[face]!.length > 0);
}


