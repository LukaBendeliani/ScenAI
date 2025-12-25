'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Tour {
    id: string;
    name: string;
    description: string | null;
    thumbnail: string | null;
    updatedAt: string;
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tours, setTours] = useState<Tour[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newTourName, setNewTourName] = useState('');
    const [newTourDescription, setNewTourDescription] = useState('');
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    // Auth check
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    // Fetch tours
    const fetchTours = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/tours');
            const data = await response.json();

            if (data.success) {
                setTours(data.tours);
            } else {
                throw new Error(data.error || 'Failed to fetch tours');
            }
        } catch (err) {
            // Safe error access
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
            console.error('Error fetching tours:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchTours();
        }
    }, [session]);

    const handleCreateTour = async () => {
        if (!newTourName.trim()) return;

        try {
            setIsLoading(true);
            const response = await fetch('/api/tours', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newTourName,
                    description: newTourDescription,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setNewTourName('');
                setNewTourDescription('');
                setIsCreating(false);
                fetchTours(); // Refresh list
                // Optionally redirect to editor immediately
                router.push(`/editor/${data.tour.id}`);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            // Safe error access
            const errorMessage = err instanceof Error ? err.message : 'Failed to create tour';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTour = async (tourId: string) => {
        try {
            const response = await fetch(`/api/tours/${tourId}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                setDeleteConfirmId(null);
                fetchTours(); // Refresh list
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete tour';
            setError(errorMessage);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(`${label} copied!`);
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div
            className="min-h-screen w-full overflow-y-auto overflow-x-hidden"
            style={{ backgroundColor: 'var(--bg-primary)' }}
        >
            {/* Navbar */}
            <nav
                className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
                style={{
                    backgroundColor: 'rgba(10, 10, 14, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid var(--border-dark)',
                }}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                                <ellipse cx="12" cy="12" rx="9" ry="4" stroke="white" strokeWidth="1.5" />
                                <circle cx="12" cy="12" r="2" fill="white" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-500">
                            Dashboard
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{
                                    background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                                    color: 'var(--bg-primary)',
                                }}
                            >
                                {session.user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-white">
                                    {session.user?.name || 'User'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="px-4 py-2 rounded-lg text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">

                {/* Header & Create Button */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Tours</h1>
                        <p className="text-gray-400">Manage and share your 360° experiences</p>
                    </div>

                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-transform hover:scale-105"
                        style={{
                            background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
                            color: 'var(--bg-primary)',
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Create New Tour
                    </button>
                </div>

                {/* Copy Feedback Toast */}
                <AnimatePresence>
                    {copyFeedback && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="fixed bottom-8 right-8 px-6 py-3 rounded-xl bg-green-500 text-white shadow-lg pointer-events-none z-50"
                        >
                            {copyFeedback}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create Form */}
                <AnimatePresence>
                    {isCreating && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8 overflow-hidden"
                        >
                            <div className="p-6 rounded-2xl bg-[#0F1115] border border-cyan-500/30">
                                <h3 className="text-lg font-semibold text-white mb-4">New Tour Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Tour Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-lg bg-[#1A1D24] border border-[#2A2E37] text-white focus:border-cyan-500 outline-none"
                                            placeholder="My Awesome Tour"
                                            value={newTourName}
                                            onChange={e => setNewTourName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Description</label>
                                        <textarea
                                            className="w-full px-4 py-3 rounded-lg bg-[#1A1D24] border border-[#2A2E37] text-white focus:border-cyan-500 outline-none resize-none"
                                            placeholder="Optional description..."
                                            rows={2}
                                            value={newTourDescription}
                                            onChange={e => setNewTourDescription(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={handleCreateTour}
                                            disabled={!newTourName.trim() || isLoading}
                                            className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-semibold hover:opacity-90 disabled:opacity-50"
                                        >
                                            {isLoading ? 'Creating...' : 'Create Tour'}
                                        </button>
                                        <button
                                            onClick={() => setIsCreating(false)}
                                            className="px-6 py-2 rounded-lg bg-[#1A1D24] text-gray-400 hover:text-white border border-[#2A2E37]"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error Message */}
                {error && (
                    <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500">
                        {error}
                    </div>
                )}

                {/* Tours Grid */}
                {isLoading && !tours.length ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                    </div>
                ) : tours.length === 0 ? (
                    <div className="text-center py-20 bg-[#0F1115] rounded-3xl border border-[#1A1D24] border-dashed">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1A1D24] flex items-center justify-center text-gray-400">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No tours yet</h3>
                        <p className="text-gray-400 mb-6">Create your first 360° tour to see it here</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="px-6 py-2 rounded-lg text-sm bg-[#1A1D24] hover:bg-[#252830] text-white border border-[#2A2E37] transition-colors"
                        >
                            Create Tour
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tours.map((tour) => (
                            <motion.div
                                key={tour.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#0F1115] rounded-xl overflow-hidden border border-[#1A1D24] hover:border-cyan-500/50 transition-colors group"
                            >
                                {/* Thumbnail */}
                                <div className="aspect-video relative bg-[#1A1D24]">
                                    {tour.thumbnail ? (
                                        <img src={tour.thumbnail} alt={tour.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                <polyline points="21 15 16 10 5 21"></polyline>
                                            </svg>
                                        </div>
                                    )}

                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                        <button
                                            onClick={() => router.push(`/editor/${tour.id}`)}
                                            className="px-6 py-2 rounded-full bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transform transition hover:scale-105"
                                        >
                                            Edit Tour
                                        </button>
                                        <button
                                            onClick={() => router.push(`/tour/${tour.id}`)}
                                            className="px-6 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                                        >
                                            View Public
                                        </button>
                                    </div>
                                </div>

                                {/* Info & Toolbar */}
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-white truncate mb-1" title={tour.name}>{tour.name}</h3>
                                    <p className="text-xs text-gray-500 mb-4">Updated {new Date(tour.updatedAt).toLocaleDateString()}</p>

                                    <div className="flex items-center justify-between border-t border-[#1A1D24] pt-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => copyToClipboard(`${window.location.origin}/tour/${tour.id}`, 'Link')}
                                                className="p-2 rounded-lg hover:bg-[#1A1D24] text-gray-400 hover:text-cyan-400 transition-colors"
                                                title="Copy Link"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(`<iframe src="${window.location.origin}/tour/${tour.id}" width="900" height="600" allowFullScreen></iframe>`, 'Embed Code')}
                                                className="p-2 rounded-lg hover:bg-[#1A1D24] text-gray-400 hover:text-cyan-400 transition-colors"
                                                title="Copy Iframe"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setDeleteConfirmId(tour.id)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete Tour"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6z"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Delete Confirmation Overlay */}
                                <AnimatePresence>
                                    {deleteConfirmId === tour.id && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-[#0F1115]/95 flex flex-col items-center justify-center p-6 text-center z-10"
                                        >
                                            <h4 className="text-white font-semibold mb-2">Delete this tour?</h4>
                                            <p className="text-xs text-gray-400 mb-4">This action cannot be undone.</p>
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    onClick={() => handleDeleteTour(tour.id)}
                                                    className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(null)}
                                                    className="flex-1 py-2 rounded-lg bg-[#1A1D24] text-white text-sm font-medium hover:bg-[#252830]"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
