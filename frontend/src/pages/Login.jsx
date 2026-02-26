import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { LogIn, AlertCircle, ArrowRight } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({});
  const { login, googleLogin, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      /* error handled by context */
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/dashboard');
    } catch {
      /* error handled by context */
    }
  };

  const handleGoogleError = () => {
    clearError();
  };

  const clearOnType = (setter) => (e) => {
    setter(e.target.value);
    if (error) clearError();
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const inputCls =
    'w-full px-4 h-[48px] bg-[#FAFAFA] border border-[#D1D5DB] text-[15px] text-bauhaus-fg placeholder:text-[#BCBCBC] placeholder:italic focus:border-[#1040C0] focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,64,192,0.08)] disabled:bg-[#F3F3F3] disabled:text-[#BCBCBC] disabled:cursor-not-allowed transition-all duration-150';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-bauhaus-bg">
      {/* ── Brand side ── */}
      <div className="hidden lg:flex lg:w-[36%] bg-bauhaus-blue relative overflow-hidden items-center justify-center shrink-0">
        {/* Background shapes — very faint */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-[10%] left-[8%] w-44 h-44 rounded-full border-2 border-white" />
          <div className="absolute bottom-[14%] right-[10%] w-32 h-32 border-2 border-white" />
        </div>
        <div className="relative z-10 text-center px-10">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            EM-Connect
          </h1>
          <div className="mt-3 h-0.75 w-12 bg-bauhaus-yellow mx-auto" />
          <p className="mt-4 text-xs font-semibold text-white/50 tracking-[0.2em] uppercase">
            Event Management Platform
          </p>
        </div>
      </div>

      {/* ── Form side ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-lg">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 bg-bauhaus-red" />
              <div className="w-2.5 h-2.5 bg-bauhaus-yellow" />
              <div className="w-2.5 h-2.5 bg-bauhaus-blue" />
            </div>
            <span className="text-lg font-black text-bauhaus-fg tracking-tight uppercase">
              EM-Connect
            </span>
          </div>

          {/* ── Card ── */}
          <div className="bg-white border-2 border-bauhaus-fg shadow-[5px_5px_0px_0px_#121212]">
            <div className="p-8 sm:p-10 lg:p-12">
              {/* Header */}
              <div className="flex items-center gap-3.5 mb-10">
                <div className="w-11 h-11 bg-bauhaus-red flex items-center justify-center shrink-0">
                  <LogIn className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-bauhaus-fg tracking-tight uppercase leading-none">
                    Sign In
                  </h2>
                  <p className="text-[13px] text-[#6B7280] mt-1">
                    Welcome back to your dashboard
                  </p>
                </div>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-8 flex items-start gap-3 bg-[#FEF2F2] border-l-[3px] border-bauhaus-red px-4 py-3 rounded-sm">
                  <AlertCircle className="w-4 h-4 text-bauhaus-red shrink-0 mt-0.5" />
                  <p className="flex-1 text-sm text-bauhaus-red">{error}</p>
                  <button onClick={clearError} className="text-bauhaus-red font-bold leading-none p-0.5 hover:opacity-70" aria-label="Dismiss">×</button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="mb-7">
                  <label htmlFor="login-email" className="block text-[12px] font-bold text-bauhaus-fg/70 uppercase tracking-[0.08em] mb-3">
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={clearOnType(setEmail)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="you@example.com"
                    disabled={loading}
                    className={inputCls}
                  />
                  {touched.email && email && !emailValid && (
                    <p className="mt-2 text-xs text-bauhaus-red font-medium">Enter a valid email address</p>
                  )}
                </div>

                {/* Password */}
                <div className="mb-8">
                  <div className="flex items-baseline justify-between mb-3">
                    <label htmlFor="login-password" className="text-[12px] font-bold text-bauhaus-fg/70 uppercase tracking-[0.08em]">
                      Password
                    </label>
                    <span className="text-[11px] text-[#BCBCBC] select-none" title="Coming soon">
                      Forgot password?
                    </span>
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={clearOnType(setPassword)}
                    placeholder="Enter your password"
                    disabled={loading}
                    className={inputCls}
                  />
                </div>

                {/* CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12.5 bg-bauhaus-red border-2 border-bauhaus-fg text-white font-bold text-[14px] uppercase tracking-[0.15em] shadow-[4px_4px_0px_0px_#121212] hover:shadow-[2px_2px_0px_0px_#121212] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="bauhaus-spinner" />
                      Signing in…
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Google Sign In */}
              {GOOGLE_CLIENT_ID && (
                <div className="mt-7">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-[#E5E7EB]" />
                    <span className="text-[11px] font-bold text-[#BCBCBC] uppercase tracking-[0.12em] select-none">or</span>
                    <div className="flex-1 h-px bg-[#E5E7EB]" />
                  </div>
                  <div className="flex justify-center [&>div]:w-full [&_iframe]:!w-full">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="outline"
                      size="large"
                      shape="rectangular"
                      text="signin_with"
                      width="400"
                      logo_alignment="center"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#E5E7EB] px-8 sm:px-10 lg:px-12 py-5">
              <p className="text-center text-sm text-[#6B7280]">
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-bauhaus-blue hover:text-[#0D3399] underline underline-offset-2 transition-colors inline-flex items-center gap-1"
                >
                  Create one <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            </div>
          </div>

          {/* Accent bar */}
          <div className="mt-5 flex h-1">
            <div className="flex-1 bg-bauhaus-red" />
            <div className="flex-1 bg-bauhaus-yellow" />
            <div className="flex-1 bg-bauhaus-blue" />
          </div>
        </div>
      </div>
    </div>
  );
}