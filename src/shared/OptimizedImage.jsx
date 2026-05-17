import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Optimized Image Component
 * Features:
 * - Lazy loading by default
 * - Skeleton loader for loading state
 * - Fallback icon for error state
 * - Smooth transition when image is loaded
 */
const OptimizedImage = ({ 
    src, 
    alt, 
    className = "", 
    containerClassName = "",
    priority = false 
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Reset states when src changes by using a key on the image or container
    // or just handle it here in render logic (but state reset is better via key)

    return (
        <div key={src} className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${containerClassName}`}>
            {/* Loading Skeleton */}
            <AnimatePresence>
                {!isLoaded && !hasError && (
                    <motion.div 
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800"
                    />
                )}
            </AnimatePresence>

            {/* Error UI */}
            {hasError ? (
                <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 p-4 text-center">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs font-medium">Image unavailable</span>
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    loading={priority ? "eager" : "lazy"}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setHasError(true)}
                    className={`transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
                />
            )}
        </div>
    );
};

export default OptimizedImage;
