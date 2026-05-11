import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, ClipboardList } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-40 px-6 py-2" style={{
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(247,177,189,0.35)',
      boxShadow: '0 4px 24px rgba(241,136,155,0.08)',
    }}>

      {/* ── Desktop layout ── */}
      <div className="hidden sm:flex items-center justify-between relative h-12">
        {/* Left */}
        <div className="flex items-center gap-5">
          <Link to="/Calendar">
            <button className="px-5 py-1.5 rounded-full text-sm font-medium transition-all" style={
              location.pathname === '/Calendar'
                ? {backgroundColor: '#f1889b', color: 'white', boxShadow: '0 2px 12px rgba(241,136,155,0.35)'}
                : {backgroundColor: 'transparent', color: '#b67651'}
            }>
              Calendar
            </button>
          </Link>
          <Link to="/RequestForm">
            <button className="px-5 py-1.5 rounded-full text-sm font-medium transition-all" style={
              location.pathname === '/RequestForm'
                ? {backgroundColor: '#f1889b', color: 'white', boxShadow: '0 2px 12px rgba(241,136,155,0.35)'}
                : {backgroundColor: 'transparent', color: '#b67651'}
            }>
              Submit Request
            </button>
          </Link>
        </div>

        {/* Center Logo */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <img
            src="https://media.base44.com/images/public/69b4780e4278ece8feeae352/2e08be1fc_image.png"
            alt="PIP Events"
            className="w-14 h-14 object-contain drop-shadow-sm"
          />
        </Link>

        {/* Right — Dashboard icon */}
        <Link
          to="/RequestDashboard"
          className="p-2.5 rounded-full transition-all"
          title="Request Board"
          style={{
            color: location.pathname === '/RequestDashboard' ? '#f1889b' : '#b67651',
            background: location.pathname === '/RequestDashboard' ? 'rgba(241,136,155,0.12)' : 'transparent',
          }}
        >
          <LayoutDashboard className="w-5 h-5" />
        </Link>
      </div>

      {/* ── Mobile layout ── */}
      <div className="flex sm:hidden items-center justify-between h-12 relative">
        {/* Left: nav icons */}
        <div className="flex items-center gap-1">
          <Link
            to="/Calendar"
            className="p-2.5 rounded-full transition-all"
            title="Calendar"
            style={{
              color: location.pathname === '/Calendar' ? '#f1889b' : '#b67651',
              background: location.pathname === '/Calendar' ? 'rgba(241,136,155,0.12)' : 'transparent',
            }}
          >
            <CalendarDays className="w-5 h-5" />
          </Link>
          <Link
            to="/RequestForm"
            className="p-2.5 rounded-full transition-all"
            title="Submit Request"
            style={{
              color: location.pathname === '/RequestForm' ? '#f1889b' : '#b67651',
              background: location.pathname === '/RequestForm' ? 'rgba(241,136,155,0.12)' : 'transparent',
            }}
          >
            <ClipboardList className="w-5 h-5" />
          </Link>
        </div>

        {/* Centre: logo absolutely centered */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          <img
            src="https://media.base44.com/images/public/69b4780e4278ece8feeae352/2e08be1fc_image.png"
            alt="PIP Events"
            className="w-10 h-10 object-contain drop-shadow-sm"
          />
        </Link>

        {/* Right: dashboard */}
        <Link
          to="/RequestDashboard"
          className="p-2.5 rounded-full transition-all"
          title="Request Board"
          style={{
            color: location.pathname === '/RequestDashboard' ? '#f1889b' : '#b67651',
            background: location.pathname === '/RequestDashboard' ? 'rgba(241,136,155,0.12)' : 'transparent',
          }}
        >
          <LayoutDashboard className="w-5 h-5" />
        </Link>
      </div>

    </nav>
  );
}