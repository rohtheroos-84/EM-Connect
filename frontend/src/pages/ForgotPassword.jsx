import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ShieldCheck, Lock, AlertCircle, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { forgotPassword, verifyResetCode, resetPassword, resendResetCode } from '../services/api';

const STEPS = { EMAIL: 0, CODE: 1, PASSWORD: 2, DONE: 3 };

export default function ForgotPassword() {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  const clearError = () => setError('');

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const inputCls =
    'w-full px-4 h-[48px] bg-[#FAFAFA] border border-[#D1D5DB] text-[15px] text-bauhaus-fg placeholder:text-[#BCBCBC] placeholder:italic focus:border-[#1040C0] focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,64,192,0.08)] disabled:bg-[#F3F3F3] disabled:text-[#BCBCBC] disabled:cursor-not-allowed transition-all duration-150';

  const btnCls =
    'w-full h-12.5 border-2 border-bauhaus-fg text-white font-bold text-[14px] uppercase tracking-[0.15em] shadow-[4px_4px_0px_0px_#121212] hover:shadow-[2px_2px_0px_0px_#121212] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 cursor-pointer';

  const sanitizeCode = (value) => value.replace(/\D/g, '').slice(0, 6);

  /* ── Step 1: Request code ── */
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      await forgotPassword(email);
      setStep(STEPS.CODE);
      setResendCooldown(30);
      setInfoMessage('Reset code sent. You can request another code in 30 seconds.');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const verifyCodeValue = async (value) => {
    if (value.length !== 6) {
      setError('Enter the full 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      const res = await verifyResetCode(email, value);
      if (res.valid) {
        setStep(STEPS.PASSWORD);
      } else {
        setError(res.message || 'Invalid or expired code');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Verify code ── */
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    await verifyCodeValue(code);
  };

  const handleCodePaste = async (e) => {
    if (loading) return;

    const pastedText = e.clipboardData?.getData('text') || '';
    if (!pastedText) return;

    e.preventDefault();
    const sanitized = sanitizeCode(pastedText);
    setCode(sanitized);
    clearError();

    if (sanitized.length === 6) {
      await verifyCodeValue(sanitized);
      return;
    }

    setError('Paste must include all 6 digits');
  };

  const handleResendCode = async () => {
    if (loading || resending || resendCooldown > 0) return;

    setResending(true);
    setError('');
    setInfoMessage('');
    try {
      const res = await resendResetCode(email);
      const cooldown = Number(res?.cooldownSeconds) || 30;
      setResendCooldown(cooldown);
      setInfoMessage(res?.message || 'If an account with that email exists, a reset code has been sent.');
    } catch (err) {
      setError(err.message || 'Unable to resend reset code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  /* ── Step 3: Reset password ── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      await resetPassword(email, code, newPassword);
      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const stepIcons = [
    <Mail key="mail" className="w-5 h-5 text-white" />,
    <ShieldCheck key="shield" className="w-5 h-5 text-white" />,
    <Lock key="lock" className="w-5 h-5 text-white" />,
  ];

  const stepLabels = ['Email', 'Verify', 'Reset'];

  const stepColors = ['bg-bauhaus-blue', 'bg-bauhaus-yellow', 'bg-bauhaus-red'];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-bauhaus-bg">
      {/* ── Brand side ── */}
      <div className="hidden lg:flex lg:w-[36%] bg-bauhaus-blue relative overflow-hidden items-center justify-center shrink-0">
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
              <div className="flex items-center gap-3.5 mb-8">
                <div className="w-11 h-11 bg-bauhaus-red flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-bauhaus-fg tracking-tight uppercase leading-none">
                    Reset Password
                  </h2>
                  <p className="text-[13px] text-[#6B7280] mt-1">
                    {step === STEPS.DONE ? 'All done!' : `Step ${step + 1} of 3`}
                  </p>
                </div>
              </div>

              {/* Step indicator */}
              {step !== STEPS.DONE && (
                <div className="flex items-center gap-2 mb-8">
                  {[0, 1, 2].map((s) => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                      <div
                        className={`w-8 h-8 flex items-center justify-center shrink-0 transition-all duration-200 ${
                          step >= s
                            ? `${stepColors[s]} ${s === 1 ? 'text-bauhaus-fg' : 'text-white'}`
                            : 'bg-[#E5E7EB] text-[#BCBCBC]'
                        }`}
                      >
                        {step > s ? (
                          <CheckCircle className={`w-4 h-4 ${s === 1 ? 'text-bauhaus-fg' : 'text-white'}`} />
                        ) : (
                          stepIcons[s]
                        )}
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-[0.08em] ${
                        step >= s ? 'text-bauhaus-fg' : 'text-[#BCBCBC]'
                      }`}>
                        {stepLabels[s]}
                      </span>
                      {s < 2 && <div className={`flex-1 h-px ${step > s ? 'bg-bauhaus-fg' : 'bg-[#E5E7EB]'}`} />}
                    </div>
                  ))}
                </div>
              )}

              {/* Error banner */}
              {error && (
                <div className="mb-6 flex items-start gap-3 bg-[#FEF2F2] border-l-[3px] border-bauhaus-red px-4 py-3 rounded-sm">
                  <AlertCircle className="w-4 h-4 text-bauhaus-red shrink-0 mt-0.5" />
                  <p className="flex-1 text-sm text-bauhaus-red">{error}</p>
                  <button onClick={clearError} className="text-bauhaus-red font-bold leading-none p-0.5 hover:opacity-70" aria-label="Dismiss">×</button>
                </div>
              )}

              {infoMessage && (
                <div className="mb-6 flex items-start gap-3 bg-[#F0F9FF] border-l-[3px] border-bauhaus-blue px-4 py-3 rounded-sm">
                  <p className="flex-1 text-sm text-bauhaus-blue">{infoMessage}</p>
                </div>
              )}

              {/* ── Step 1: Email ── */}
              {step === STEPS.EMAIL && (
                <form onSubmit={handleRequestCode}>
                  <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
                    Enter the email address associated with your account. We&apos;ll send you a 6-digit code to reset your password.
                  </p>
                  <div className="mb-7">
                    <label htmlFor="reset-email" className="block text-[12px] font-bold text-bauhaus-fg/70 uppercase tracking-[0.08em] mb-3">
                      Email Address
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearError(); }}
                      placeholder="you@example.com"
                      disabled={loading}
                      className={inputCls}
                      autoFocus
                    />
                  </div>
                  <button type="submit" disabled={loading || !email} className={`${btnCls} bg-bauhaus-blue`}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="bauhaus-spinner" /> Sending…
                      </span>
                    ) : (
                      'Send Reset Code'
                    )}
                  </button>
                </form>
              )}

              {/* ── Step 2: Code ── */}
              {step === STEPS.CODE && (
                <form onSubmit={handleVerifyCode}>
                  <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
                    We sent a 6-digit code to <strong className="text-bauhaus-fg">{email}</strong>. Enter it below to continue.
                  </p>
                  <div className="mb-7">
                    <label htmlFor="reset-code" className="block text-[12px] font-bold text-bauhaus-fg/70 uppercase tracking-[0.08em] mb-3">
                      Reset Code
                    </label>
                    <input
                      id="reset-code"
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(e) => { setCode(sanitizeCode(e.target.value)); clearError(); }}
                      onPaste={handleCodePaste}
                      placeholder="000000"
                      disabled={loading}
                      className={`${inputCls} text-center text-2xl font-bold tracking-[0.5em] font-mono`}
                      autoFocus
                    />
                    <p className="mt-2 text-xs text-[#9CA3AF]">Code expires in 15 minutes</p>
                  </div>
                  <button type="submit" disabled={loading || code.length !== 6} className={`${btnCls} bg-bauhaus-yellow text-bauhaus-fg`}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="bauhaus-spinner" /> Verifying…
                      </span>
                    ) : (
                      'Verify Code'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading || resending || resendCooldown > 0}
                    className="w-full mt-3 text-sm text-bauhaus-blue hover:text-[#0D3399] transition-colors disabled:text-[#9CA3AF] disabled:cursor-not-allowed"
                  >
                    {resending
                      ? 'Sending new code...'
                      : resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : 'Resend code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(STEPS.EMAIL);
                      setCode('');
                      setResendCooldown(0);
                      setInfoMessage('');
                      clearError();
                    }}
                    className="w-full mt-3 text-sm text-[#6B7280] hover:text-bauhaus-fg transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> Use a different email
                  </button>
                </form>
              )}

              {/* ── Step 3: New password ── */}
              {step === STEPS.PASSWORD && (
                <form onSubmit={handleResetPassword}>
                  <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
                    Code verified! Enter your new password below.
                  </p>
                  <div className="mb-5">
                    <label htmlFor="new-password" className="block text-[12px] font-bold text-bauhaus-fg/70 uppercase tracking-[0.08em] mb-3">
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); clearError(); }}
                      placeholder="At least 8 characters"
                      disabled={loading}
                      className={inputCls}
                      autoFocus
                    />
                  </div>
                  <div className="mb-7">
                    <label htmlFor="confirm-password" className="block text-[12px] font-bold text-bauhaus-fg/70 uppercase tracking-[0.08em] mb-3">
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                      placeholder="Repeat your password"
                      disabled={loading}
                      className={inputCls}
                    />
                  </div>
                  <button type="submit" disabled={loading || !newPassword || !confirmPassword} className={`${btnCls} bg-bauhaus-red`}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="bauhaus-spinner" /> Resetting…
                      </span>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              )}

              {/* ── Step 4: Done ── */}
              {step === STEPS.DONE && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-[#16A34A] flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-extrabold text-bauhaus-fg uppercase tracking-tight mb-2">
                    Password Reset!
                  </h3>
                  <p className="text-sm text-[#6B7280] mb-8 leading-relaxed">
                    Your password has been changed successfully. You can now sign in with your new password.
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className={`${btnCls} bg-bauhaus-blue`}
                  >
                    Go to Sign In
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#E5E7EB] px-8 sm:px-10 lg:px-12 py-5">
              <p className="text-center text-sm text-[#6B7280]">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-bauhaus-blue hover:text-[#0D3399] underline underline-offset-2 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
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
