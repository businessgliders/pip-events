import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-40" style={{borderColor: '#f7b1bd'}}>
      <div className="flex items-center gap-5">
        <Link to="/Calendar">
          <button className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
            location.pathname === '/Calendar'
              ? 'text-white'
              : 'border text-white'
          }`} style={location.pathname === '/Calendar'
            ? {backgroundColor: '#f1889b'}
            : {backgroundColor: '#f7b1bd', borderColor: '#f7b1bd'}}>
            Calendar
          </button>
        </Link>
        <Link to="/RequestForm" className="text-sm transition-colors"
          style={{color: location.pathname === '/RequestForm' ? '#f1889b' : '#b67651', fontWeight: location.pathname === '/RequestForm' ? 600 : 400}}>
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
        <Link to="/Dashboard" className="text-sm transition-colors"
          style={{color: location.pathname === '/Dashboard' ? '#f1889b' : '#b67651', fontWeight: location.pathname === '/Dashboard' ? 600 : 400}}>
          Dashboard
        </Link>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{backgroundColor: '#fbe0e2', color: '#f1889b'}}>
          👤
        </div>
      </div>
    </nav>
  );
}