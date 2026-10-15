import React, { useState } from "react";
import { useAuth } from "../lib/authContext";
import { X, Lock, Mail, User, Sparkles, ArrowRight } from "lucide-react";
import { USER_ROLES } from "../lib/dataModels";

export const LoginModal = ({ isOpen, onClose }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, setDemoRole } =
    useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, fullName);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role) => {
    setDemoRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-stone-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-stone-900 animate-scaleUp">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#00A69C] border border-teal-200 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">Trim Choice Staff Portal</h3>
              <p className="text-xs text-stone-500">Sign in to access shop jobs, pricing & cut lists</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-stone-800 hover:bg-stone-50 py-2.5 px-4 rounded-xl border border-stone-300 shadow-2xs transition-all text-sm font-semibold cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google Workspace</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px bg-stone-200 flex-1"></div>
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">
              or with employee email
            </span>
            <div className="h-px bg-stone-200 flex-1"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] shadow-2xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@trimchoice.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#00A69C] focus:ring-1 focus:ring-[#00A69C] shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00A69C] hover:bg-[#009087] text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSignUp ? "Register Account" : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <div className="text-center text-xs text-stone-500">
            {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#00A69C] hover:underline font-bold ml-1 cursor-pointer"
            >
              {isSignUp ? "Sign In" : "Request Staff Access"}
            </button>
          </div>

          {/* Quick Demo Logins for Instant Testing */}
          <div className="mt-4 pt-4 border-t border-stone-100 bg-stone-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#00A69C]" />
              <span>One-Click Demo Roles (Instant Testing)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo(USER_ROLES.STAFF)}
                className="bg-white hover:bg-stone-100 text-teal-700 border border-teal-200 rounded-xl p-2 text-xs text-left transition-colors cursor-pointer shadow-2xs"
              >
                <div className="font-bold">Staff Estimator</div>
                <div className="text-[10px] text-stone-500">Full jobs & quotes</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo(USER_ROLES.ADMIN)}
                className="bg-white hover:bg-stone-100 text-amber-700 border border-amber-200 rounded-xl p-2 text-xs text-left transition-colors cursor-pointer shadow-2xs"
              >
                <div className="font-bold">Administrator</div>
                <div className="text-[10px] text-stone-500">Users & Price books</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
