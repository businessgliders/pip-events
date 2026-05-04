import { useLocation, useNavigate } from 'react-router-dom';
import HlsVideo from '../components/HlsVideo';
import Navbar from '../components/layout/Navbar';
import { Check, Mail, Sparkles } from 'lucide-react';

export default function Confirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const name = state?.name || 'there';
  const email = state?.email || '';
  const eventType = state?.eventType || 'your event';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background video */}
      <HlsVideo
        src="https://video.squarespace-cdn.com/content/v1/6876866bd3fbe434b6566570/5e57b3a9-5624-4a07-b555-c3847af04b51/playlist.m3u8"
        className="fixed inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />
      {/* Pink overlay */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 1,
          background:
            'linear-gradient(135deg, rgba(248,210,220,0.92), rgba(241,136,155,0.85))',
        }}
      />

      <div className="relative" style={{ zIndex: 2 }}>
        <Navbar />

        <div className="max-w-lg mx-auto px-4 py-12 sm:py-20 flex flex-col items-center">
          <div
            className="rounded-3xl p-8 sm:p-10 w-full text-center"
            style={{
              background: 'rgba(255,255,255,0.65)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 16px 56px rgba(241,136,155,0.2)',
            }}
          >
            {/* Logo */}
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b4780e4278ece8feeae352/86f0df21b_Pilatesinpinklogojusticon1.png"
              alt="Pilates in Pink"
              className="w-14 h-14 object-contain mx-auto mb-4 drop-shadow-sm"
            />

            {/* Check icon */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                background: 'linear-gradient(135deg, #f1889b, #e86c84)',
                boxShadow: '0 8px 24px rgba(241,136,155,0.4)',
              }}
            >
              <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>

            <p
              className="text-xs font-medium tracking-[0.3em] uppercase mb-2"
              style={{ color: '#c48a96' }}
            >
              Request Received
            </p>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#b67651' }}>
              Thank You{name !== 'there' ? `, ${name}` : ''}!
            </h1>
            <p className="text-sm mb-2" style={{ color: '#7a4a3a' }}>
              Your <span className="font-semibold" style={{ color: '#e86c84' }}>{eventType}</span> request has been submitted successfully.
            </p>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: '#9a7070' }}>
              We've received your event request and will review it carefully. Our team will get back to you within 24 hours to discuss availability and next steps.
            </p>

            {email && (
              <div
                className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-7 text-left"
                style={{
                  background: 'rgba(251,224,226,0.5)',
                  border: '1px solid rgba(247,177,189,0.4)',
                }}
              >
                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#f1889b' }} />
                <p className="text-xs leading-relaxed" style={{ color: '#9a5a6a' }}>
                  A confirmation email has been sent to{' '}
                  <strong style={{ color: '#e86c84' }}>{email}</strong>
                </p>
              </div>
            )}

            <button
              onClick={() => navigate('/RequestForm')}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm text-white transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #f1889b, #e86c84)',
                boxShadow: '0 6px 20px rgba(241,136,155,0.35)',
              }}
            >
              <Sparkles className="w-4 h-4" />
              Submit Another Request
            </button>
          </div>

          <p className="text-center text-xs mt-8" style={{ color: 'rgba(255,255,255,0.85)' }}>
            © {new Date().getFullYear()} Pilates in Pink™ • All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}