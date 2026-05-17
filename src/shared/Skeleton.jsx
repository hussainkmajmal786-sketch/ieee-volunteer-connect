import React from 'react';

/**
 * Reusable Skeleton loader component for loading states.
 * Uses Tailwind's animate-pulse for a smooth loading effect.
 */
const Skeleton = ({ className = "", variant = "rect" }) => {
    const baseClass = "animate-pulse bg-gray-200 dark:bg-gray-800";
    
    const variants = {
        circle: "rounded-full",
        rect: "rounded-lg",
        text: "rounded h-4 w-full",
        title: "rounded h-8 w-3/4"
    };

    return (
        <div className={`${baseClass} ${variants[variant] || variants.rect} ${className}`} />
    );
};

export const EventCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-0">
        <Skeleton className="h-48 w-full" variant="rect" />
        <div className="p-6">
            <Skeleton className="mb-3" variant="title" />
            <div className="flex justify-between">
                <Skeleton className="w-24" variant="text" />
                <Skeleton className="w-16" variant="text" />
            </div>
        </div>
    </div>
);

export default Skeleton;
