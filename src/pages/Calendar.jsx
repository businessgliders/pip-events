import HlsVideo from '../components/HlsVideo';
import Navbar from '../components/layout/Navbar';
import CalendarGrid from '../components/calendar/CalendarGrid';

export default function Calendar() {
  return (
    <div className="min-h-screen relative">
      <HlsVideo
        src="https://video.squarespace-cdn.com/content/v1/6876866bd3fbe434b6566570/5e57b3a9-5624-4a07-b555-c3847af04b51/playlist.m3u8"
        className="fixed inset-0 w-full h-full object-cover"
        style={{zIndex: 0}}
      />
      <div className="fixed inset-0" style={{zIndex: 1, background: 'rgba(248, 210, 220, 0.85)'}} />
      <div className="relative" style={{zIndex: 2}}>
        <Navbar />
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