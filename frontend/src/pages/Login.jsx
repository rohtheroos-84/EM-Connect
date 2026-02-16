import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({});
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // error is set in context
    }
  };

  const clearOnType = (setter) => (e) => {
    setter(e.target.value);
    if (error) clearError();
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="min-h-screen flex bg-[#F0F0F0]">
      {/* ── Brand Panel (subtle decoration) ── */}
      <div className="hidden lg:flex lg:w-[40%] xl:w-[42%] bg-[#1040C0] relative overflow-hidden items-center justify-center">
        {/* Ghosted geometric outlines — decorative but non-competing */}
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-[8%] left-[10%] w-48 h-48 rounded-full border-[3px] border-white" />
          <div className="absolute bottom-[12%] right-[8%] w-36 h-36 border-[3px] border-white" />
          <div className="absolute top-[55%] left-[45%] w-14 h-14 rounded-full border-[3px] border-white" />
        </div>

        {/* Small peripheral accents */}
        <div className="absolute top-10 right-10 w-10 h-10 bg-[#F0C020] opacity-90" />
        <div className="absolute bottom-10 left-10 w-8 h-8 rounded-full bg-[#D02020] opacity-80" />

        {/* Brand content */}
        <div className="relative z-10 text-center px-12 max-w-sm">
          <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight uppercase leading-tight">
            EM-Connect
          </h1>
          <div className="mt-4 h-1 w-16 bg-[#F0C020] mx-auto" />
          <p className="mt-5 text-sm font-medium text-white/60 tracking-widest uppercase">
            Event Management Platform
          </p>
        </div>
      </div>

      {/* ── Form Panel (primary focus) ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-[480px]">
          {/* Mobile brand */}
          <div className="lg:hidden mb-10">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-[#D02020]" />
                <div className="w-3 h-3 bg-[#F0C020]" />
                <div className="w-3 h-3 bg-[#1040C0]" />
              </div>
              <h1 className="text-2xl font-black text-[#121212] tracking-tight uppercase">
                EM-Connect
              </h1>
            </div>
          </div>

          {/* ── Form Card ── */}
          <div className="bg-white border-[3px] border-[#121212] shadow-[6px_6px_0px_0px_#121212]">
            <div className="p-8 sm:p-10">
              {/* Header */}
              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 bg-[#D02020] border-2 border-[#121212] flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_#121212]">
                  <LogIn className="w-5 h-5 text-white" />
                </div>
                <div className="pt-0.5">
                  <h2 className="text-[22px] font-extrabold text-[#121212] tracking-tight uppercase leading-none">
                    Sign In
                  </h2>
                  <p className="text-sm text-[#6B7280] mt-1.5">
                    Welcome back to your dashboard
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 flex items-start gap-3 bg-[#FEF2F2] border-l-4 border-[#D02020] px-4 py-3">
                  <AlertCircle className="w-5 h-5 text-[#D02020] shrink-0 mt-0.5" />
                  <p className="flex-1 text-sm font-medium text-[#D02020]">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-[#D02020] hover:text-[#B01818] font-bold text-lg leading-none p-1"
                    aria-label="Dismiss error"
                  >
                    ×
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="login-email" className="block text-[13px] font-bold text-[#121212] uppercase tracking-wide mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9CA3AF] pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={clearOnType(setEmail)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      placeholder="you@example.com"
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-[#121212] text-[15px] text-[#121212] placeholder:text-[#9CA3AF] placeholder:font-normal focus:border-[#1040C0] focus:shadow-[0_0_0_3px_rgba(16,64,192,0.12)] disabled:bg-[#F5F5F5] disabled:text-[#9CA3AF] disabled:cursor-not-allowed transition-all duration-200"
                    />
                  </div>
                  {touched.email && email && !emailValid && (
                    <p className="mt-1.5 text-xs text-[#D02020] font-medium">
                      Please enter a valid email address
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="login-password" className="text-[13px] font-bold text-[#121212] uppercase tracking-wide">
                      Password
                    </label>
                    <span className="text-xs text-[#9CA3AF] cursor-default select-none" title="Coming soon">
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9CA3AF] pointer-events-none" />
                    <input
                      id="login-password"
                      type="password"
                      required
                      value={password}
                      onChange={clearOnType(setPassword)}
                      placeholder="Enter your password"
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-[#121212] text-[15px] text-[#121212] placeholder:text-[#9CA3AF] placeholder:font-normal focus:border-[#1040C0] focus:shadow-[0_0_0_3px_rgba(16,64,192,0.12)] disabled:bg-[#F5F5F5] disabled:text-[#9CA3AF] disabled:cursor-not-allowed transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#D02020] border-[3px] border-[#121212] text-white font-bold text-[15px] uppercase tracking-widest shadow-[5px_5px_0px_0px_#121212] hover:shadow-[2px_2px_0px_0px_#121212] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[5px] active:translate-y-[5px] disabled:opacity-50 disabled:pointer-events-none transition-all duration-150 cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2.5">
                        <span className="bauhaus-spinner" />
                        Signing in…
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Card footer — secondary action */}
            <div className="px-8 sm:px-10 pb-8 sm:pb-10">
              <div className="flex items-center gap-4 mb-5">
                <div className="flex-1 h-px bg-[#E5E7EB]" />
                <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                  or
                </span>
                <div className="flex-1 h-px bg-[#E5E7EB]" />
              </div>
              <p className="text-center text-sm text-[#6B7280]">
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="font-bold text-[#1040C0] hover:text-[#0D3399] underline underline-offset-2 transition-colors duration-200 inline-flex items-center gap-1"
                >
                  Create one <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </p>
            </div>
          </div>

          {/* Bauhaus accent bar */}
          <div className="mt-6 flex h-1.5 shadow-[3px_3px_0px_0px_#121212]">
            <div className="flex-1 bg-[#D02020]" />
            <div className="flex-1 bg-[#F0C020]" />
            <div className="flex-1 bg-[#1040C0]" />
          </div>
        </div>
      </div>
    </div>
  );
}
