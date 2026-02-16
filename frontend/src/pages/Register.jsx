import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(null);
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch {
      // error is set in context
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-bauhaus-bg flex">
      {/* ── Right-side decorative panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#D02020] relative overflow-hidden items-center justify-center order-2">
        <div className="absolute inset-0">
          <div className="absolute top-[10%] right-[15%] w-56 h-40 bg-[#1040C0] border-4 border-[#121212] shadow-[8px_8px_0px_0px_#121212]" />
          <div className="absolute bottom-[20%] left-[10%] w-52 h-52 rounded-full bg-[#F0C020] border-4 border-[#121212]" />
          <div className="absolute top-[55%] right-[45%] w-20 h-20 bg-white border-4 border-[#121212]" />
          <div className="absolute top-[35%] left-0 w-full h-[2px] bg-white/20" />
          <div className="absolute top-[65%] left-0 w-full h-[2px] bg-white/20" />
          <div className="absolute top-0 left-[60%] w-[2px] h-full bg-white/20" />
        </div>
        <div className="relative z-10 text-center px-12">
          <h1 className="text-6xl font-black text-white tracking-tighter uppercase">
            Join Us
          </h1>
          <div className="mt-4 h-1 w-32 bg-[#F0C020] mx-auto" />
          <p className="mt-6 text-lg font-medium text-white/80 tracking-wide uppercase">
            Start managing events today
          </p>
        </div>
      </div>

      {/* ── Left: Register form ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 order-1">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-12">
            <h1 className="text-4xl font-black text-[#121212] tracking-tighter uppercase">
              EM-Connect
            </h1>
            <div className="mt-3 h-1 w-24 bg-[#1040C0] mx-auto" />
          </div>

          {/* Card */}
          <div className="relative bg-white border-4 border-[#121212] shadow-[8px_8px_0px_0px_#121212] p-10">
            {/* Corner decorations */}
            <div className="absolute -top-[14px] -left-[14px] w-7 h-7 bg-[#1040C0] border-4 border-[#121212]" />
            <div className="absolute -top-[14px] -right-[14px] w-7 h-7 bg-[#F0C020] border-4 border-[#121212] rounded-full" />

            {/* Header */}
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-[#1040C0] border-2 border-[#121212] flex items-center justify-center shadow-[4px_4px_0px_0px_#121212]">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#121212] tracking-tight uppercase">
                  Create Account
                </h2>
                <p className="text-sm text-[#121212]/60 font-medium mt-0.5">
                  Get started for free
                </p>
              </div>
            </div>

            {/* Error */}
            {displayError && (
              <div className="mb-8 flex items-center gap-3 bg-[#D02020]/10 border-2 border-[#D02020] p-4">
                <AlertCircle className="w-5 h-5 text-[#D02020] shrink-0" />
                <p className="text-sm font-medium text-[#D02020]">{displayError}</p>
                <button
                  onClick={() => { setLocalError(null); clearError(); }}
                  className="ml-auto text-[#D02020] font-bold text-lg leading-none hover:opacity-70 cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-[#121212] uppercase tracking-wider mb-2.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#121212]/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3.5 bg-bauhaus-bg border-2 border-[#121212] font-medium text-[#121212] placeholder:text-[#121212]/30 transition-shadow duration-200"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#121212] uppercase tracking-wider mb-2.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#121212]/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-bauhaus-bg border-2 border-[#121212] font-medium text-[#121212] placeholder:text-[#121212]/30 transition-shadow duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#121212] uppercase tracking-wider mb-2.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#121212]/40" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-12 pr-4 py-3.5 bg-bauhaus-bg border-2 border-[#121212] font-medium text-[#121212] placeholder:text-[#121212]/30 transition-shadow duration-200"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-[#121212] uppercase tracking-wider mb-2.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#121212]/40" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-bauhaus-bg border-2 border-[#121212] font-medium text-[#121212] placeholder:text-[#121212]/30 transition-shadow duration-200"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-[#1040C0] border-2 border-[#121212] text-white font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#121212] hover:shadow-[2px_2px_0px_0px_#121212] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex-1 h-[2px] bg-bauhaus-fg/10" />
              <span className="text-xs font-bold text-[#121212]/40 uppercase tracking-wider">
                or
              </span>
              <div className="flex-1 h-[2px] bg-bauhaus-fg/10" />
            </div>

            {/* Login link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-[#121212]/60 font-medium">
                Already have an account?
              </p>
              <Link
                to="/login"
                className="inline-block mt-3 px-6 py-2.5 bg-white border-2 border-[#121212] text-[#121212] font-bold uppercase tracking-wider text-sm shadow-[4px_4px_0px_0px_#121212] hover:shadow-[2px_2px_0px_0px_#121212] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 ease-out"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Bottom detail */}
          <div className="mt-8 flex justify-center gap-3">
            <div className="w-4 h-4 bg-[#1040C0] border-2 border-[#121212] rounded-full" />
            <div className="w-4 h-4 bg-[#D02020] border-2 border-[#121212]" />
            <div className="w-4 h-4 bg-[#F0C020] border-2 border-[#121212] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
