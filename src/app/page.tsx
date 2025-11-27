'use client';

import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled for Three.js components
const EditorWrapper = dynamic(() => import('@/components/EditorWrapper'), {
  ssr: false,
  loading: () => (
    <div
      className="h-screen w-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary, #0A0A0E)' }}
    >
      <div className="text-center">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full animate-spin"
          style={{
            border: '3px solid var(--border-dark, #303540)',
            borderTopColor: 'var(--neon-blue, #00F0FF)',
          }}
        />
        <p style={{ color: 'var(--text-secondary, #A0A0B0)', fontSize: '14px' }}>
          Loading 360° Editor...
        </p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <EditorWrapper />;
}
