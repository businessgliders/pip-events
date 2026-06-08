import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import HlsVideo from '../components/HlsVideo';
import CalendarGrid from '../components/calendar/CalendarGrid';
import GlassNav from '../components/layout/GlassNav';
import usePageTitle from '@/hooks/usePageTitle';
import { useAuth } from '@/lib/AuthContext';

function getInitials(name, email) {
  const source = (name || email || '').trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function Calendar() {
  usePageTitle('Calendar');
  const { user } = useAuth();
  const isSignedIn = !!user;
  return (
    <div className="min-h-screen relative">
      <HlsVideo
        src="https://video.squarespace-cdn.com/content/v1/6876866bd3fbe434b6566570/5e57b3a9-5624-4a07-b555-c3847af04b51/playlist.m3u8"
        className="fixed inset-0 w-full h-full object-cover"
        style={{zIndex: 0}}
      />
      <div className="fixed inset-0" style={{zIndex: 1, background: 'rgba(248, 210, 220, 0.85)'}} />

      {/* Top-right corner — padlock when signed out, user initial when signed in.
          Both link to the staff dashboard (which gates access itself). */}
      <Link
        to="/RequestBoard"
        title={isSignedIn ? `Signed in as ${user.full_name || user.email}` : 'Staff Dashboard'}
        className="fixed top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{
          zIndex: 10,
          background: isSignedIn ? '#f1889b' : 'rgba(255,255,255,0.18)',
          backdropFilter: isSignedIn ? 'none' : 'blur(10px)',
          WebkitBackdropFilter: isSignedIn ? 'none' : 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.35)',
          boxShadow: isSignedIn ? '0 4px 12px rgba(241,136,155,0.35)' : 'none',
        }}
      >
        {isSignedIn ? (
          <span className="text-xs font-semibold text-white">
            {getInitials(user.full_name, user.email)}
          </span>
        ) : (
          <Lock className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.85)' }} />
        )}
      </Link>

      <div className="relative" style={{zIndex: 2}}>
        <GlassNav />
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">

          <div className="text-center mb-4">
            <div className="inline-block rounded-xl px-5 py-2.5" style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 4px 20px rgba(241,136,155,0.12)',
            }}>
              <h1 className="text-lg font-bold" style={{color: '#b67651'}}>Event Calendar</h1>
              <p className="text-xs" style={{color: '#f1889b'}}>Pick a date and request your event</p>
            </div>
          </div>

          <CalendarGrid />

          <p className="text-center text-xs mt-4" style={{color: 'white'}}>
            Click any date to see availability and request your event
          </p>
        </div>
      </div>
    </div>
  );
}