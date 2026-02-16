import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, ArrowRight, Check, X } from 'lucide-react';

function getPasswordStrength(pwd) {
  if (!pwd) return { level: 0, label: '', color: '#E5E7EB' };
  let s = 0;
  if (pwd.length >= 6) s++;
  if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  if (s <= 1) return { level: 1, label: 'Weak', color: '#D02020' };
  if (s <= 2) return { level: 2, label: 'Fair', color: '#F0C020' };
  if (s <= 3) return { level: 3, label: 'Good', color: '#1040C0' };
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

  const valid = {
    name: name.length >= 2,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    password: password.length >= 6,
    confirm: confirmPassword.length > 0 && confirmPassword === password,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (password !== confirmPassword) { setLocalError('Passwords do not match'); return; }
    if (password.length < 6) { setLocalError('Password must be at least 6 characters'); return; }
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch { /* context sets error */ }
  };

  const displayError = localError || error;

  const clearOnType = (setter) => (e) => {
    setter(e.target.value);
    if (localError) setLocalError(null);
    if (error) clearError();
  };

  const borderFor = (field) => {
    const vals = { name, email, password, confirm: confirmPassword };
    if (touched[field] && vals[field]?.length > 0 && !valid[field]) return 'border-bauhaus-red';
    return 'border-[#D1D5DB]';
  };

  const inputCls = (field) =>
    `w-full px-4 h-[48px] bg-[#FAFAFA] border text-[15px] text-bauhaus-fg placeholder:text-[#BCBCBC] placeholder:italic focus:border-[#1040C0] focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,64,192,0.08)] disabled:bg-[#F3F3F3] disabled:text-[#BCBCBC] disabled:cursor-not-allowed transition-all duration-150 ${borderFor(field)}`;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-bauhaus-bg">
      {/* ── Brand side (right) ── */}
      <div className="hidden lg:flex lg:w-[36%] bg-bauhaus-red relative overflow-hidden items-center justify-center shrink-0 order-2">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-[12%] right-[10%] w-36 h-36 border-2 border-white" />
          <div className="absolute bottom-[15%] left-[12%] w-44 h-44 rounded-full border-2 border-white" />
        </div>
        <div className="relative z-10 text-center px-10">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            Join Us
          </h1>
          <div className="mt-3 h-0.75 w-12 bg-bauhaus-yellow mx-auto" />
          <p className="mt-4 text-xs font-semibold text-white/50 tracking-[0.2em] uppercase">
            Start Managing Events Today
          </p>
        </div>
      </div>

      {/* ── Form side (left) ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 order-1">
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
                <div className="w-11 h-11 bg-bauhaus-blue flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-bauhaus-fg tracking-tight uppercase leading-none">
                    Create Account
                  </h2>
                  <p className="text-[13px] text-[#6B7280] mt-1">
                    Get started for free
                  </p>
                </div>
              </div>

              {/* Error */}
              {displayError && (
                <div className="mb-8 flex items-start gap-3 bg-[#FEF2F2] border-l-[3px] border-bauhaus-red px-4 py-3 rounded-sm">
                  <AlertCircle className="w-4 h-4 text-bauhaus-red shrink-0 mt-0.5" />
                  <p className="flex-1 text-sm text-bauhaus-red">{displayError}</p>
                  <button onClick={() => { setLocalError(null); clearError(); }} className="text-bauhaus-red font-bold leading-none p-0.5 hover:opacity-70" aria-label="Dismiss">×</button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Name */}
                <div className="mb-6">
                  <label htmlFor="reg-name" className="block text-[12px] font-bold text-bauhaus-fg/70 uppercase tracking-[0.08em] mb-3">
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={name}
                    onChange={clearOnType(setName)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    placeholder="John Doe"
                    disabled={loading}
                    className={inputCls('name')}
                  />
                  {touched.name && name.length > 0 && !valid.name && (
                    <p className="mt-2 text-xs text-bauhaus-red font-medium">Name must be at least 2 characters</p>
                  )}
                </div>

                {/* Email */}
                <div className="mb-6">
                  <label htmlFor="reg-email" className="block text-[12px] font-bold text-bauhaus-fg/70 uppercase tracking-[0.08em] mb-3">
                    Email Address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={clearOnType(setEmail)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="you@example.com"
                    disabled={loading}
                    className={inputCls('email')}
                  />
                  {touched.email && email.length > 0 && !valid.email && (
                    <p className="mt-2 text-xs text-bauhaus-red font-medium">Enter a valid email address</p>
                  )}
                </div>

                {/* Password */}
                <div className="mb-6">
                  <label htmlFor="reg-password" className="block text-[12px] font-bold text-bauhaus-fg/70 uppercase tracking-[0.08em] mb-3">
                    Password
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    value={password}
                    onChange={clearOnType(setPassword)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    placeholder="Min 6 characters"
                    disabled={loading}
                    className={inputCls('password')}
                  />
                  {/* Strength meter — flush under input */}
                  {password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-0.5 flex-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-0.75 flex-1 transition-colors duration-300"
                            style={{ backgroundColor: i <= strength.level ? strength.color : '#E5E7EB' }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wide w-12 text-right" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div className="mb-6">
                  <label htmlFor="reg-confirm" className="block text-[12px] font-bold text-bauhaus-fg/70 uppercase tracking-[0.08em] mb-3">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="reg-confirm"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={clearOnType(setConfirmPassword)}
                      onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                      placeholder="Re-enter password"
                      disabled={loading}
                      className={`${inputCls('confirm')} pr-11`}
                    />
                    {confirmPassword.length > 0 && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        {valid.confirm
                          ? <Check className="w-4 h-4 text-[#16A34A]" />
                          : <X className="w-4 h-4 text-bauhaus-red" />}
                      </div>
                    )}
                  </div>
                  {touched.confirm && confirmPassword.length > 0 && !valid.confirm && (
                    <p className="mt-2 text-xs text-bauhaus-red font-medium">Passwords do not match</p>
                  )}
                </div>

                {/* Terms */}
                <p className="text-[11px] text-[#BCBCBC] leading-relaxed mb-6">
                  By creating an account you agree to the Terms of Service and Privacy Policy.
                </p>

                {/* CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12.5 bg-bauhaus-blue border-2 border-bauhaus-fg text-white font-bold text-[14px] uppercase tracking-[0.15em] shadow-[4px_4px_0px_0px_#121212] hover:shadow-[2px_2px_0px_0px_#121212] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="bauhaus-spinner" />
                      Creating account…
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="border-t border-[#E5E7EB] px-8 sm:px-10 lg:px-12 py-5">
              <p className="text-center text-sm text-[#6B7280]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-bauhaus-blue hover:text-[#0D3399] underline underline-offset-2 transition-colors inline-flex items-center gap-1"
                >
                  Sign in <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            </div>
          </div>

          {/* Accent bar */}
          <div className="mt-5 flex h-1">
            <div className="flex-1 bg-bauhaus-blue" />
            <div className="flex-1 bg-bauhaus-yellow" />
            <div className="flex-1 bg-bauhaus-red" />
          </div>
        </div>
      </div>
    </div>
  );
}

