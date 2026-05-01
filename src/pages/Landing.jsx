import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Sparkles, Users, Heart, ArrowDown } from 'lucide-react';
import HlsVideo from '../components/HlsVideo';
import CalendarGrid from '../components/calendar/CalendarGrid';

const features = [
  {
    icon: CalendarDays,
    title: 'Private Events',
    desc: 'Book the studio for birthdays, showers & more',
  },
  {
    icon: Users,
    title: 'Up to 9 Guests',
    desc: 'Intimate sessions for you and your group',
  },
  {
    icon: Sparkles,
    title: 'Custom Add-Ons',
    desc: 'Décor, refreshments & curated extras',
  },
  {
    icon: Heart,
    title: 'Wellness Experience',
    desc: 'A beautiful, energizing way to celebrate',
  },
];

export default function Landing() {
  const calendarRef = useRef(null);

  const scrollToCalendar = () => {
    calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <HlsVideo
        src="https://video.squarespace-cdn.com/content/v1/6876866bd3fbe434b6566570/5e57b3a9-5624-4a07-b555-c3847af04b51/playlist.m3u8"
        className="fixed inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />
      <div
        className="fixed inset-0"
        style={{
          zIndex: 1,
          background:
            'linear-gradient(135deg, rgba(248,210,220,0.92), rgba(241,136,155,0.85))',
        }}
      />

      <div className="relative" style={{ zIndex: 2 }}>
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 sm:pt-24 sm:pb-20">
          {/* Hero */}
          <div className="flex flex-col items-center text-center">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b4780e4278ece8feeae352/86f0df21b_Pilatesinpinklogojusticon1.png"
              alt="Pilates in Pink"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md mb-5"
            />
            <p className="text-sm sm:text-base font-medium tracking-[0.3em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Pilates in Pink™
            </p>
            <h1
              className="text-4xl sm:text-6xl font-bold mb-5 leading-tight"
              style={{ color: 'white', textShadow: '0 2px 12px rgba(180,80,100,0.25)' }}
            >
              Celebrate with Us
            </h1>
            <p
              className="text-base sm:text-lg max-w-2xl mb-8 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.95)' }}
            >
              Host your next birthday, bridal shower, bachelorette, or corporate
              wellness event in our pink Pilates studio — an unforgettable experience
              for you and your guests.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={scrollToCalendar}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm transition-all hover:scale-105"
                style={{
                  background: 'white',
                  color: '#e86c84',
                  boxShadow: '0 8px 24px rgba(180,80,100,0.25)',
                }}
              >
                View Calendar <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-14 sm:mt-20">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-5 sm:p-6 text-center transition-all hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.65)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.6)',
                  boxShadow: '0 8px 32px rgba(241,136,155,0.15)',
                }}
              >
                <div
                  className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
                  style={{ background: 'rgba(241,136,155,0.18)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: '#e86c84' }} />
                </div>
                <h3 className="text-sm sm:text-base font-bold mb-1.5" style={{ color: '#7a4a3a' }}>
                  {title}
                </h3>
                <p className="text-xs sm:text-sm leading-snug" style={{ color: '#9a7070' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>

          {/* Embedded Calendar */}
          <div ref={calendarRef} className="mt-14 sm:mt-20 scroll-mt-6">
            <div className="max-w-4xl mx-auto">
              <CalendarGrid />
            </div>
            <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Click any date to see availability and request your event
            </p>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs mt-12" style={{ color: 'rgba(255,255,255,0.85)' }}>
            © {new Date().getFullYear()} Pilates in Pink™ • All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}