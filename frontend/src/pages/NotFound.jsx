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
      <div className="min-h-full w-full px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-full max-w-5xl bg-bauhaus-white border-2 border-bauhaus-fg shadow-[5px_5px_0px_0px_#121212] overflow-hidden">
          <div className="h-1 flex">
            <div className="flex-1 bg-bauhaus-red" />
            <div className="flex-1 bg-bauhaus-yellow" />
            <div className="flex-1 bg-bauhaus-blue" />
          </div>

          <div className="p-8 sm:p-10 lg:p-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FEF2F2] border border-bauhaus-red/30 text-bauhaus-red text-[10px] font-bold uppercase tracking-wider">
              <SearchX className="w-3.5 h-3.5" />
              404 - Not Found
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-black text-bauhaus-fg tracking-tight uppercase leading-tight">
              This Page Does Not Exist
            </h1>

            <p className="mt-3 text-sm text-[#6B7280] leading-relaxed max-w-2xl mx-auto">
              The URL you entered does not match a route in this app. Use one of the actions below to continue safely.
            </p>

            <div className="mt-5 inline-flex items-center justify-center w-full max-w-3xl px-3 py-2 bg-bauhaus-bg border border-[#1F2937]/20 text-xs text-bauhaus-fg/75 font-mono break-all">
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
    </AppLayout>
  );
}
