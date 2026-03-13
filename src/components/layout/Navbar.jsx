import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-pink-100 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-5">
        <Link to="/Calendar">
          <button className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
            location.pathname === '/Calendar'
              ? 'bg-pink-400 text-white shadow-sm'
              : 'border border-pink-300 text-pink-500 hover:bg-pink-50'
          }`}>
            Calendar
          </button>
        </Link>
        <Link to="/RequestForm" className={`text-sm transition-colors ${
          location.pathname === '/RequestForm' ? 'text-pink-500 font-medium' : 'text-gray-500 hover:text-pink-400'
        }`}>
          Submit Request
        </Link>
      </div>

      <Link to="/Calendar" className="flex items-center justify-center">
        <div className="w-9 h-9 rounded-full border-2 border-pink-300 flex items-center justify-center bg-pink-50">
          <span className="text-pink-500 font-bold text-base leading-none">P</span>
        </div>
      </Link>

      <div className="flex items-center gap-5">
        <Link to="/Dashboard" className={`text-sm transition-colors ${
          location.pathname === '/Dashboard' ? 'text-pink-500 font-medium' : 'text-gray-500 hover:text-pink-400'
        }`}>
          Dashboard
        </Link>
        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-400 text-sm">
          👤
        </div>
      </div>
    </nav>
  );
}