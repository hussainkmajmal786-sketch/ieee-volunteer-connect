import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import MetaTags from '../shared/MetaTags';

/**
 * 404 Not Found Page
 * Premium design with glassmorphism and animations.
 */
const NotFoundPage = () => {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <MetaTags 
                title="Page Not Found" 
                description="The page you are looking for does not exist or has been moved."
            />
            
            <div className="max-w-lg w-full text-center">
                <div className="relative mb-12">
                    <h1 className="text-[12rem] font-black text-gray-100 dark:text-gray-800 leading-none select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-gradient-to-r from-ieee-blue to-cyan-500 text-transparent bg-clip-text text-5xl font-black uppercase tracking-tighter">
                            Lost in Space
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Oops! This page vanished.
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg">
                    The link you followed might be broken, or the page may have been removed. 
                    Don&apos;t worry, you can always head back to the main stage.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/" className="w-full sm:w-auto">
                        <Button className="w-full flex items-center justify-center gap-2 px-8 py-4 shadow-xl shadow-ieee-blue/20">
                            <Home className="w-5 h-5" /> Back to Home
                        </Button>
                    </Link>
                    <button 
                        onClick={() => window.history.back()} 
                        className="w-full sm:w-auto px-8 py-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" /> Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
