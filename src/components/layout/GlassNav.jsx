import { Link, useLocation } from 'react-router-dom';

export default function GlassNav() {
  const { pathname } = useLocation();
  const isCalendar = pathname.toLowerCase() === '/calendar';
  const isRequest = pathname.toLowerCase() === '/requestform';

  const linkStyle = (active) => ({
    background: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.18)',
    color: active ? '#e86c84' : 'white',
    border: active
      ? '1px solid rgba(255,255,255,0.9)'
      : '1px solid rgba(255,255,255,0.35)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: active ? '0 4px 14px rgba(180,80,100,0.18)' : 'none',
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5">
      <div className="flex items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b4780e4278ece8feeae352/86f0df21b_Pilatesinpinklogojusticon1.png"
            alt="Pilates in Pink"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-md transition-transform group-hover:scale-105"
          />
          <span
            className="hidden sm:inline text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            Pilates in Pink™
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-2">
          <Link
            to="/Calendar"
            className="px-4 sm:px-5 py-2 rounded-full font-semibold text-xs sm:text-sm transition-all hover:scale-105"
            style={linkStyle(isCalendar)}
          >
            Calendar
          </Link>
          <Link
            to="/RequestForm"
            className="px-4 sm:px-5 py-2 rounded-full font-semibold text-xs sm:text-sm transition-all hover:scale-105"
            style={linkStyle(isRequest)}
          >
            Submit Request
          </Link>
        </div>
      </div>
    </div>
  );
}