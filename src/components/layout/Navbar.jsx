import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-pink-100 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-5">
        <Link to="/Calendar">
          <button className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
            location.pathname === '/Calendar'
              ? 'text-white shadow-sm'
              : 'border border-[#f7b1bd] text-[#f1889b] hover:bg-[#fbe0e2]'
          } ${location.pathname === '/Calendar' ? 'bg-[#f1889b]' : ''
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
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b4780e4278ece8feeae352/86f0df21b_Pilatesinpinklogojusticon1.png"
          alt="Pilates in Pink"
          className="w-10 h-10 object-contain"
        />
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