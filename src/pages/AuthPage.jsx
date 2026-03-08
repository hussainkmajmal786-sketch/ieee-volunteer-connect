import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [showPw, setShowPw] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { user, loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();

    // If already logged in, redirect
    useEffect(() => {
        if (user) {
            const redirectPath = location.state?.from?.pathname || "/dashboard";
            navigate(redirectPath, { replace: true });
        }
    }, [user, navigate, location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                await loginWithEmail(email, password);
            } else {
                await registerWithEmail(name, email, password);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to authenticate");
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError(null);
        setLoading(true);
        try {
            await loginWithGoogle();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to authenticate with Google");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-ieee-blue/5 via-white to-cyan-50/30 dark:from-ieee-dark dark:via-gray-900 dark:to-gray-950 -z-10" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-ieee-blue/10 rounded-full filter blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-400/10 rounded-full filter blur-[100px] -z-10" />

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-ieee-blue to-cyan-600 p-8 text-center">
                        <div className="bg-white/20 p-3 rounded-2xl w-fit mx-auto mb-4">
                            <Globe className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-white">{isLogin ? "Welcome Back" : "Create Account"}</h2>
                        <p className="text-white/80 text-sm mt-1">{isLogin ? "Sign in to your IEEE Connect profile" : "Start your volunteer journey today"}</p>
                    </div>

                    <div className="p-8">
                        {/* Google Button */}
                        <button onClick={handleGoogle} disabled={loading} className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-6 disabled:opacity-50">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                            Continue with Google
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">or</span>
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-4 border border-red-200 dark:border-red-900/50">
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue focus:border-transparent outline-none transition" required />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="email" placeholder="you@ieee.org" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue focus:border-transparent outline-none transition" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue focus:border-transparent outline-none transition" required />
                                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {isLogin && (
                                <div className="text-right">
                                    <a href="#" className="text-sm text-ieee-blue dark:text-cyan-400 font-medium hover:underline">Forgot password?</a>
                                </div>
                            )}

                            <Button isLoading={loading} className="w-full py-3.5 text-base mt-2">
                                {isLogin ? "Sign In" : "Create Account"} <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-6">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                            <button onClick={() => setIsLogin(!isLogin)} className="text-ieee-blue dark:text-cyan-400 font-bold hover:underline">
                                {isLogin ? "Sign Up" : "Sign In"}
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
