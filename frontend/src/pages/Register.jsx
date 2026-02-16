import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, AlertCircle, ArrowRight, Check, X } from 'lucide-react';

/* ── Password strength calculator ── */
function getPasswordStrength(pwd) {
  if (!pwd) return { level: 0, label: '', color: '#E5E7EB' };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: '#D02020' };
  if (score <= 2) return { level: 2, label: 'Fair', color: '#F0C020' };
  if (score <= 3) return { level: 3, label: 'Good', color: '#1040C0' };
  return { level: 4, label: 'Strong', color: '#16A34A' };
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({});
  const [localError, setLocalError] = useState(null);
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const validations = {
    name: name.length >= 2,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    password: password.length >= 6,
    confirmPassword: confirmPassword.length > 0 && confirmPassword === password,
  };

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

  const clearOnType = (setter) => (e) => {
    setter(e.target.value);
    if (localError) setLocalError(null);
    if (error) clearError();
  };

  const getInputBorder = (field) => {
    const vals = { name, email, password, confirmPassword };
    const val = vals[field] || '';
    if (touched[field] && val.length > 0 && !validations[field]) {
      return 'border-[#D02020]';
    }
    return 'border-[#121212]';
  };

  const inputBase =
    'w-full pl-12 pr-4 py-3.5 bg-white border-2 text-[15px] text-[#121212] placeholder:text-[#9CA3AF] placeholder:font-normal focus:border-[#1040C0] focus:shadow-[0_0_0_3px_rgba(16,64,192,0.12)] disabled:bg-[#F5F5F5] disabled:text-[#9CA3AF] disabled:cursor-not-allowed transition-all duration-200';

  return (
    <div className="min-h-screen flex bg-[#F0F0F0]">
      {/* ── Brand Panel (right, subtle decoration) ── */}
      <div className="hidden lg:flex lg:w-[40%] xl:w-[42%] bg-[#D02020] relative overflow-hidden items-center justify-center order-2">
        {/* Ghosted geometric outlines */}
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-[12%] right-[10%] w-40 h-40 border-[3px] border-white" />
          <div className="absolute bottom-[15%] left-[12%] w-48 h-48 rounded-full border-[3px] border-white" />
          <div className="absolute top-[50%] right-[42%] w-12 h-12 border-[3px] border-white" />
        </div>

        {/* Small peripheral accents */}
        <div className="absolute top-10 left-10 w-10 h-10 bg-[#1040C0] opacity-90" />
        <div className="absolute bottom-10 right-10 w-8 h-8 rounded-full bg-[#F0C020] opacity-80" />

        {/* Brand content */}
        <div className="relative z-10 text-center px-12 max-w-sm">
          <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight uppercase leading-tight">
            Join Us
          </h1>
          <div className="mt-4 h-1 w-16 bg-[#F0C020] mx-auto" />
          <p className="mt-5 text-sm font-medium text-white/60 tracking-widest uppercase">
            Start Managing Events Today
          </p>
        </div>
      </div>

      {/* ── Form Panel (primary focus, left) ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 order-1">
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
                <div className="w-12 h-12 bg-[#1040C0] border-2 border-[#121212] flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_#121212]">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div className="pt-0.5">
                  <h2 className="text-[22px] font-extrabold text-[#121212] tracking-tight uppercase leading-none">
                    Create Account
                  </h2>
                  <p className="text-sm text-[#6B7280] mt-1.5">
                    Get started for free
                  </p>
                </div>
              </div>

              {/* Error */}
              {displayError && (
                <div className="mb-6 flex items-start gap-3 bg-[#FEF2F2] border-l-4 border-[#D02020] px-4 py-3">
                  <AlertCircle className="w-5 h-5 text-[#D02020] shrink-0 mt-0.5" />
                  <p className="flex-1 text-sm font-medium text-[#D02020]">{displayError}</p>
                  <button
                    onClick={() => {
                      setLocalError(null);
                      clearError();
                    }}
                    className="text-[#D02020] hover:text-[#B01818] font-bold text-lg leading-none p-1"
                    aria-label="Dismiss error"
                  >
                    ×
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label htmlFor="reg-name" className="block text-[13px] font-bold text-[#121212] uppercase tracking-wide mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9CA3AF] pointer-events-none" />
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={name}
                      onChange={clearOnType(setName)}
                      onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                      placeholder="John Doe"
                      disabled={loading}
                      className={`${inputBase} ${getInputBorder('name')}`}
                    />
                  </div>
                  {touched.name && name.length > 0 && !validations.name && (
                    <p className="mt-1.5 text-xs text-[#D02020] font-medium">
                      Name must be at least 2 characters
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="reg-email" className="block text-[13px] font-bold text-[#121212] uppercase tracking-wide mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9CA3AF] pointer-events-none" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={clearOnType(setEmail)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      placeholder="you@example.com"
                      disabled={loading}
                      className={`${inputBase} ${getInputBorder('email')}`}
                    />
                  </div>
                  {touched.email && email.length > 0 && !validations.email && (
                    <p className="mt-1.5 text-xs text-[#D02020] font-medium">
                      Please enter a valid email address
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="reg-password" className="block text-[13px] font-bold text-[#121212] uppercase tracking-wide mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9CA3AF] pointer-events-none" />
                    <input
                      id="reg-password"
                      type="password"
                      required
                      value={password}
                      onChange={clearOnType(setPassword)}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      placeholder="Min 6 characters"
                      disabled={loading}
                      className={`${inputBase} ${getInputBorder('password')}`}
                    />
                  </div>
                  {/* Password strength meter */}
                  {password.length > 0 && (
                    <div className="mt-2.5">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-colors duration-300"
                            style={{
                              backgroundColor: i <= strength.level ? strength.color : '#E5E7EB',
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: strength.color }}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="reg-confirm" className="block text-[13px] font-bold text-[#121212] uppercase tracking-wide mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9CA3AF] pointer-events-none" />
                    <input
                      id="reg-confirm"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={clearOnType(setConfirmPassword)}
                      onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                      placeholder="Re-enter password"
                      disabled={loading}
                      className={`${inputBase} pr-12 ${getInputBorder('confirmPassword')}`}
                    />
                    {/* Match indicator icon */}
                    {confirmPassword.length > 0 && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        {validations.confirmPassword ? (
                          <Check className="w-[18px] h-[18px] text-[#16A34A]" />
                        ) : (
                          <X className="w-[18px] h-[18px] text-[#D02020]" />
                        )}
                      </div>
                    )}
                  </div>
                  {touched.confirmPassword && confirmPassword.length > 0 && !validations.confirmPassword && (
                    <p className="mt-1.5 text-xs text-[#D02020] font-medium">
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* Terms notice */}
                <p className="text-xs text-[#9CA3AF] leading-relaxed">
                  By creating an account, you agree to the Terms of Service and Privacy Policy.
                </p>

                {/* Submit */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#1040C0] border-[3px] border-[#121212] text-white font-bold text-[15px] uppercase tracking-widest shadow-[5px_5px_0px_0px_#121212] hover:shadow-[2px_2px_0px_0px_#121212] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[5px] active:translate-y-[5px] disabled:opacity-50 disabled:pointer-events-none transition-all duration-150 cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2.5">
                        <span className="bauhaus-spinner" />
                        Creating account…
                      </span>
                    ) : (
                      'Create Account'
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
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-bold text-[#1040C0] hover:text-[#0D3399] underline underline-offset-2 transition-colors duration-200 inline-flex items-center gap-1"
                >
                  Sign in <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </p>
            </div>
          </div>

          {/* Bauhaus accent bar */}
          <div className="mt-6 flex h-1.5 shadow-[3px_3px_0px_0px_#121212]">
            <div className="flex-1 bg-[#1040C0]" />
            <div className="flex-1 bg-[#F0C020]" />
            <div className="flex-1 bg-[#D02020]" />
          </div>
        </div>
      </div>
    </div>
  );
}
