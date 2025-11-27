import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_CLOUD_API_KEY || '',
});

// Use Gemini 2.5 Flash for fast analysis
const analysisModel = 'gemini-2.5-flash';

// Use Gemini 3 Pro for image generation (stitching)
const generationModel = 'gemini-3-pro-image-preview';

interface ImageData {
  data: string; // base64 data
  mimeType: string;
}

interface AnalyzedImage {
  index: number;
  position: number; // 0-360 degrees, position in panorama
  overlapLeft: number; // percentage overlap with image to the left
  overlapRight: number; // percentage overlap with image to the right
  description: string;
  features: string[];
}

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.OFF,
  }
];

async function analyzeImagesForPositioning(images: ImageData[]): Promise<AnalyzedImage[]> {
  const imageParts = images.map((img, index) => ({
    inlineData: {
      data: img.data,
      mimeType: img.mimeType,
    }
  }));

  const analysisPrompt = `You are an expert in panoramic image stitching. Analyze these ${images.length} images that are meant to be stitched together into a 360-degree panorama.

For each image, determine:
1. Its approximate angular position in the panorama (0-360 degrees, where 0 is the starting point)
2. The percentage of overlap with adjacent images (estimate based on visual features)
3. Key visual features that can be used for alignment

IMPORTANT: Analyze the visual content, lighting direction, and common elements between images to determine the correct order and positioning.

Return your analysis as a JSON array with the following structure:
[
  {
    "index": 0,
    "position": 0,
    "overlapLeft": 0,
    "overlapRight": 15,
    "description": "Brief description of the image content",
    "features": ["key feature 1", "key feature 2"]
  },
  ...
]

The positions should be arranged so that when combined, they form a complete 360-degree view. Analyze ALL ${images.length} images and return exactly ${images.length} entries in the array.

Return ONLY the JSON array, no other text.`;

  const response = await ai.models.generateContent({
    model: analysisModel,
    contents: [
      { 
        role: 'user', 
        parts: [
          ...imageParts,
          { text: analysisPrompt }
        ] 
      }
    ],
    config: {
      maxOutputTokens: 8192,
      temperature: 0.1,
      safetySettings,
    },
  });

  const textResponse = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
  
  if (!textResponse) {
    throw new Error('No analysis response from AI');
  }

  // Parse JSON response
  try {
    // Clean up the response - remove markdown code blocks if present
    let jsonStr = textResponse.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const analyzed: AnalyzedImage[] = JSON.parse(jsonStr);
    
    // Sort by position
    return analyzed.sort((a, b) => a.position - b.position);
  } catch (parseError) {
    console.error('Failed to parse AI analysis:', textResponse);
    throw new Error('Failed to parse image analysis results');
  }
}

async function stitchPanorama(images: ImageData[], analysis: AnalyzedImage[]): Promise<string> {
  // Sort images according to analysis
  const sortedImages = analysis.map(a => images[a.index]);
  
  // Create image parts for the generation model
  const imageParts = sortedImages.map((img) => ({
    inlineData: {
      data: img.data,
      mimeType: img.mimeType,
    }
  }));

  const stitchPrompt = `These ${images.length} images have been analyzed and ordered to form a 360-degree panorama. 
  
The images are provided in order from left to right, covering the full 360-degree view.

Analysis of image positions:
${analysis.map((a, i) => `Image ${i + 1}: Position ${a.position}°, ${a.description}`).join('\n')}

Please create a seamless 360-degree equirectangular panorama by:
1. Blending the overlapping regions between adjacent images
2. Color-correcting to ensure consistent lighting across the panorama
3. Ensuring the left and right edges connect seamlessly (since it's a 360° view)
4. Outputting a single wide panoramic image suitable for spherical projection

Generate a high-quality stitched panorama image.`;

  const response = await ai.models.generateContent({
    model: generationModel,
    contents: [
      { 
        role: 'user', 
        parts: [
          ...imageParts,
          { text: stitchPrompt }
        ] 
      }
    ],
    config: {
      maxOutputTokens: 32768,
      temperature: 0.7,
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K",
      },
      safetySettings,
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error('No response from stitching model');
  }

  // Find image part in response
  for (const part of parts) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      const mimeType = part.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${imageData}`;
    }
  }

  throw new Error('No panorama image generated');
}

export async function POST(request: NextRequest) {
  try {
    const { images } = await request.json();

    if (!images || !Array.isArray(images) || images.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 images are required for assembly' },
        { status: 400 }
      );
    }

    if (images.length > 12) {
      return NextResponse.json(
        { error: 'Maximum 12 images allowed' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_CLOUD_API_KEY) {
      return NextResponse.json(
        { error: 'Google Cloud API key not configured' },
        { status: 500 }
      );
    }

    // Parse images from data URLs
    const imageDataList: ImageData[] = images.map((dataUrl: string) => {
      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid image data URL format');
      }
      return {
        mimeType: matches[1],
        data: matches[2],
      };
    });

    // Step 1: Analyze images for positioning
    console.log('Analyzing image positions...');
    const analysis = await analyzeImagesForPositioning(imageDataList);
    console.log('Analysis complete:', analysis);

    // Step 2: Stitch images into panorama
    console.log('Stitching panorama...');
    const panoramaUrl = await stitchPanorama(imageDataList, analysis);
    console.log('Stitching complete');

    return NextResponse.json({
      success: true,
      imageUrl: panoramaUrl,
      analysis: analysis,
    });

  } catch (error: any) {
    console.error('Assembly error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assemble panorama' },
      { status: 500 }
    );
  }
}

