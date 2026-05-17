import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { loginSchema, registerSchema } from "../utils/validation";
import MetaTags from "../shared/MetaTags";
import { COLLEGE_BRANCHES } from "../utils/constants";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [college, setCollege] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { user, loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();
    const addToast = useToast();

    const getFriendlyError = (err) => {
        const code = err.code || "";
        if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
            return "Incorrect email or password. Please try again.";
        }
        if (code === "auth/email-already-in-use") {
            return "An account with this email already exists.";
        }
        if (code === "auth/weak-password") {
            return "Password is too weak. Please use at least 6 characters.";
        }
        if (code === "auth/invalid-email") {
            return "Please enter a valid email address.";
        }
        if (code === "auth/popup-closed-by-user") {
            return "Sign-in was cancelled.";
        }
        return err.message || "An unexpected error occurred. Please try again.";
    };

    // If already logged in, redirect
    useEffect(() => {
        if (user) {
            const redirectPath = location.state?.from?.pathname || "/dashboard";
            navigate(redirectPath, { replace: true });
        }
    }, [user, navigate, location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate input with Zod
            if (isLogin) {
                loginSchema.parse({ email, password });
                await loginWithEmail(email, password);
                addToast("Welcome back!", "success");
            } else {
                registerSchema.parse({ name, email, password });
                await registerWithEmail(name, email, password, college);
                addToast("Account created successfully!", "success");
            }
        } catch (err) {
            console.error(err);
            // Handle Zod errors (arrays) or Firebase errors (objects)
            const errMsg = err.errors ? err.errors[0].message : getFriendlyError(err);
            addToast(errMsg, "error");
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setLoading(true);
        try {
            await loginWithGoogle();
            addToast("Logged in with Google", "success");
        } catch (err) {
            console.error(err);
            addToast(getFriendlyError(err), "error");
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await resetPassword(email);
            setResetSent(true);
            addToast("Password reset link sent!", "success");
        } catch (err) {
            console.error(err);
            addToast(getFriendlyError(err), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 relative overflow-hidden">
            <MetaTags 
                title={isForgotPassword ? "Reset Password" : isLogin ? "Sign In" : "Join IEEE Connect"} 
                description="Securely sign in or create your IEEE Volunteer Connect account to start participating in events and earning rewards."
            />
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
                        <h2 className="text-2xl font-extrabold text-white">
                            {isForgotPassword ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                            {isForgotPassword
                                ? "Enter your email to receive a reset link"
                                : isLogin
                                ? "Sign in to your IEEE Connect profile"
                                : "Start your volunteer journey today"}
                        </p>
                    </div>

                    <div className="p-8">
                        {/* Only show Google if not resetting password */}
                        {!isForgotPassword && (
                            <>
                                {/* Google Button */}
                                <button onClick={handleGoogle} disabled={loading} className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all mb-6 disabled:opacity-50">
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-ieee-blue border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-2.5">
                                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google Logo" className="w-5 h-5" />
                                            <span>Continue with Google</span>
                                        </div>
                                    )}
                                </button>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">or</span>
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                </div>
                            </>
                        )}

                        {/* Success message after password reset sent */}
                        {isForgotPassword && resetSent && (
                            <div role="status" aria-live="polite" className="mb-4 rounded-xl border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-200">
                                A password reset link has been sent to <span className="font-semibold">{email}</span>. Please check your inbox (and spam folder).
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={isForgotPassword ? handleResetPassword : handleSubmit} className="space-y-4">
                            {!isLogin && !isForgotPassword && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                                        <div className="relative">
                                            <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue focus:border-transparent outline-none transition" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">College</label>
                                        <div className="relative">
                                            <input type="text" list="auth-college-options" placeholder="Select or type your college" value={college} onChange={(e) => setCollege(e.target.value)} className="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue focus:border-transparent outline-none transition" required />
                                            <datalist id="auth-college-options">
                                                {COLLEGE_BRANCHES.map(c => <option key={c} value={c} />)}
                                            </datalist>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="email" placeholder="you@ieee.org" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue focus:border-transparent outline-none transition" required />
                                </div>
                            </div>
                            
                            {!isForgotPassword && (
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
                            )}

                            {isLogin && !isForgotPassword && (
                                <div className="text-right">
                                    <button type="button" onClick={() => { setIsForgotPassword(true); }} className="btn-text">Forgot password?</button>
                                </div>
                            )}

                            <Button isLoading={loading} className="w-full py-3.5 text-base mt-2">
                                {isForgotPassword ? "Send Reset Link" : isLogin ? "Sign In" : "Create Account"} <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-6">
                            {isForgotPassword ? (
                                <>
                                    Remembered your password?{" "}
                                    <button onClick={() => { setIsForgotPassword(false); setResetSent(false); }} className="btn-text font-bold">
                                        Back to Sign In
                                    </button>
                                </>
                            ) : (
                                <>
                                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                                    <button onClick={() => { setIsLogin(!isLogin); }} className="btn-text font-bold">
                                        {isLogin ? "Sign Up" : "Sign In"}
                                    </button>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
