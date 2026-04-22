import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, LayoutDashboard, LogIn, SearchX, ShieldCheck, UserPlus } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const missingPath = `${location.pathname}${location.search}${location.hash}`;
  const isAdmin = user?.role === 'ADMIN';
  const fallbackPath = isAuthenticated ? '/dashboard' : '/events';

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallbackPath);
  };

  return (
    <AppLayout preserveLoginFrom={false}>
      <div className="min-h-full w-full px-5 sm:px-6 lg:px-8 py-8 sm:py-10 flex items-center justify-center">
        <div className="relative w-full max-w-4xl">
          <div className="pointer-events-none absolute -inset-4 sm:-inset-6 opacity-60 bg-[radial-gradient(circle_at_12%_18%,rgba(220,38,38,0.14),transparent_40%),radial-gradient(circle_at_86%_16%,rgba(234,179,8,0.2),transparent_38%),radial-gradient(circle_at_88%_86%,rgba(37,99,235,0.16),transparent_42%)]" />

          <div className="relative bg-bauhaus-white border-2 border-bauhaus-fg shadow-[6px_6px_0px_0px_#121212] overflow-hidden">
            <div className="h-1 flex">
              <div className="flex-1 bg-bauhaus-red" />
              <div className="flex-1 bg-bauhaus-yellow" />
              <div className="flex-1 bg-bauhaus-blue" />
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="grid gap-7 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
                <div className="mx-auto lg:mx-0 w-28 h-28 sm:w-32 sm:h-32 border-2 border-bauhaus-fg bg-bauhaus-bg flex items-center justify-center shadow-[3px_3px_0px_0px_#121212]">
                  <span className="text-4xl sm:text-5xl font-black text-bauhaus-fg tracking-tight">404</span>
                </div>

                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FEF2F2] border border-[#FCA5A5] text-bauhaus-red text-[10px] font-bold uppercase tracking-wider">
                    <SearchX className="w-3.5 h-3.5" />
                    Route Not Found
                  </div>

                  <h1 className="mt-4 text-2xl sm:text-3xl lg:text-[2rem] font-black text-bauhaus-fg tracking-tight uppercase leading-tight">
                    This Page Does Not Exist
                  </h1>

                  <p className="mt-3 text-sm sm:text-[15px] text-[#6B7280] leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    The URL you entered does not match a route in this app. Use one of the actions below to continue safely.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center w-full max-w-2xl mx-auto px-3 py-2.5 bg-bauhaus-bg border border-[#1F2937]/20 text-xs text-bauhaus-fg/75 font-mono break-all">
                {missingPath}
              </div>

              <div className="mt-7 flex flex-wrap gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="inline-flex items-center gap-2 h-10 px-4 border border-[#1F2937]/30 bg-bauhaus-bg text-bauhaus-fg text-xs font-bold uppercase tracking-wider hover:border-bauhaus-blue hover:text-bauhaus-blue transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Go Back
                </button>

                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-2 h-10 px-4 bg-bauhaus-blue border border-bauhaus-fg text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0D3399] transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Dashboard
                    </Link>
                    <Link
                      to="/events"
                      className="inline-flex items-center gap-2 h-10 px-4 border border-[#1F2937]/30 bg-bauhaus-bg text-bauhaus-fg text-xs font-bold uppercase tracking-wider hover:border-bauhaus-blue hover:text-bauhaus-blue transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Browse Events
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="inline-flex items-center gap-2 h-10 px-4 border border-[#1F2937]/30 bg-bauhaus-bg text-bauhaus-fg text-xs font-bold uppercase tracking-wider hover:border-bauhaus-blue hover:text-bauhaus-blue transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Admin
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 h-10 px-4 bg-bauhaus-blue border border-bauhaus-fg text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0D3399] transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 h-10 px-4 bg-bauhaus-red border border-bauhaus-fg text-white text-xs font-bold uppercase tracking-wider hover:bg-[#B91C1C] transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Register
                    </Link>
                    <Link
                      to="/events"
                      className="inline-flex items-center gap-2 h-10 px-4 border border-[#1F2937]/30 bg-bauhaus-bg text-bauhaus-fg text-xs font-bold uppercase tracking-wider hover:border-bauhaus-blue hover:text-bauhaus-blue transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Browse Events
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
