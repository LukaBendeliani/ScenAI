'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const TourViewer = dynamic(() => import('@/components/TourViewer'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
    ),
});

export default function PublicTourPage() {
    const params = useParams();
    const id = params?.tourId as string;
    const [tour, setTour] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetch(`/api/tours/${id}`)
                .then((res) => {
                    if (res.status === 404) throw new Error('Tour not found');
                    if (res.status === 401) throw new Error('Unauthorized'); // Should not happen if public, but good to check
                    if (!res.ok) throw new Error('Failed to load tour');
                    return res.json();
                })
                .then((data) => {
                    if (data.success) {
                        setTour(data.tour);
                    } else {
                        throw new Error(data.error);
                    }
                })
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
                <h1 className="text-2xl font-bold mb-4 text-red-500">Error</h1>
                <p className="text-gray-400">{error}</p>
            </div>
        );
    }

    if (!tour) return null;

    return <TourViewer tour={tour} />;
}
