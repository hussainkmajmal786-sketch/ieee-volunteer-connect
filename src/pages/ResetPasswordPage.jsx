import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock } from "lucide-react";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import MetaTags from "../shared/MetaTags";

export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const linkError = params.get("error");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const { completePasswordReset } = useAuth();
    const addToast = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) return addToast("Password must be at least 6 characters.", "error");
        if (password !== confirm) return addToast("Passwords do not match.", "error");
        setLoading(true);
        try {
            await completePasswordReset(token, password);
            addToast("Password updated — please sign in.", "success");
            navigate("/auth", { replace: true });
        } catch (err) {
            addToast(err.message || "Could not reset password.", "error");
        } finally {
            setLoading(false);
        }
    };

    const invalid = !token || linkError;
    return (
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
            <MetaTags title="Reset Password" description="Choose a new password for your IEEE Volunteer Connect account." />
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Choose a new password</h1>
                {invalid ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        This reset link is invalid or has expired. <Link to="/auth" className="text-ieee-blue font-semibold hover:underline">Request a new one</Link>.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                        {[["New password", password, setPassword], ["Confirm password", confirm, setConfirm]].map(([label, value, set]) => (
                            <label key={label} className="block">
                                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</span>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="password" value={value} onChange={(e) => set(e.target.value)} required minLength={6}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none" />
                                </div>
                            </label>
                        ))}
                        <Button type="submit" isLoading={loading} className="w-full py-3">Update password</Button>
                    </form>
                )}
            </div>
        </div>
    );
}
