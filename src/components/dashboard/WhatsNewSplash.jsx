import { useState, useEffect } from 'react';
import { X, LayoutGrid, Ghost, PartyPopper, Check, ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'pip_whatsnew_dismissed_v4_swimlanes';
const CAMPAIGN_END = new Date('2026-07-31T23:59:59Z');

const FEATURES = [
  {
    icon: LayoutGrid,
    title: 'Your Refreshed Board',
    description: 'The board now has 5 main swimlanes — New, Quoted, Waiting for Payment, Confirmed, and Ghosted — plus a dedicated Hosted panel that slides in from the right edge. Everything has its own home.',
    image: 'https://media.base44.com/images/public/69b4780e4278ece8feeae352/dc03c455f_generated_image.png',
  },
  {
    icon: Ghost,
    title: 'New "Ghosted" Swimlane',
    description: 'Inquiries that go quiet now live in their own dedicated Ghosted column on the board — no more cluttering Hosted. Use the "Archive All" button in the column header to clear them out in one click when you\'re ready.',
    image: 'https://media.base44.com/images/public/69b4780e4278ece8feeae352/a72bdcdbf_generated_image.png',
  },
  {
    icon: PartyPopper,
    title: '"Hosted" Now a Side Panel',
    description: 'Confirmed events that have been hosted now live in a slide-out panel on the right edge of the board. Click the purple "HOSTED" tab to expand it and review past events without taking up board space.',
    image: 'https://media.base44.com/images/public/69b4780e4278ece8feeae352/ac0461ebb_generated_image.png',
  },
];

export default function WhatsNewSplash() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (new Date() > CAMPAIGN_END) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setShow(true);
  }, []);

  const handleDismiss = (markRead = false) => {
    if (markRead) {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
    setShow(false);
  };

  const handleContinue = () => {
    if (step < FEATURES.length - 1) {
      setStep(step + 1);
    } else {
      handleDismiss(true);
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!show) return null;

  const feature = FEATURES[step];
  const Icon = feature.icon;
  const isLast = step === FEATURES.length - 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(58, 31, 31, 0.6)', backdropFilter: 'blur(8px)' }}
    >
      {/* Prev arrow */}
      {step > 0 && (
        <button
          onClick={handlePrev}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-[61] w-11 h-11 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-105"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" style={{ color: '#5a3535' }} />
        </button>
      )}
      {/* Next arrow */}
      {step < FEATURES.length - 1 && (
        <button
          onClick={() => setStep(step + 1)}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-[61] w-11 h-11 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-105"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" style={{ color: '#5a3535' }} />
        </button>
      )}

      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-300"
        style={{ maxHeight: '90vh' }}
      >
        {/* Close */}
        <button
          onClick={() => handleDismiss(false)}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" style={{ color: '#5a3535' }} />
        </button>

        {/* Header banner */}
        <div
          className="px-8 pt-7 pb-5"
          style={{ background: 'linear-gradient(135deg, #fbe0e2 0%, #f4b7c4 100%)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" style={{ color: '#e86c84' }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#e86c84' }}>
              What's New
            </span>
          </div>
          <h2 className="text-2xl font-bold leading-tight" style={{ color: '#3a1f1f' }}>
            {feature.title}
          </h2>
        </div>

        {/* Screenshot */}
        <div className="px-8 py-5 bg-white">
          <div
            className="rounded-2xl overflow-hidden border"
            style={{ borderColor: 'rgba(247,177,189,0.4)', background: '#fafafa' }}
          >
            <img
              src={feature.image}
              alt={feature.title}
              className="w-full h-auto object-cover"
              style={{ maxHeight: '280px' }}
            />
          </div>
        </div>

        {/* Description */}
        <div className="px-8 pb-2 flex gap-3 items-start">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(241,136,155,0.12)' }}
          >
            <Icon className="w-4 h-4" style={{ color: '#e86c84' }} />
          </div>
          <p className="text-sm leading-relaxed flex-1" style={{ color: '#5a3535' }}>
            {feature.description}
          </p>
        </div>

        {/* Footer */}
        <div
          className="px-8 py-5 mt-4 flex items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(247,177,189,0.3)', background: 'rgba(251,224,226,0.2)' }}
        >
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {FEATURES.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === step ? '24px' : '8px',
                  background: i === step ? '#e86c84' : 'rgba(241,136,155,0.3)',
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDismiss(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors hover:bg-white"
              style={{ color: '#7a5555' }}
            >
              <Check className="w-3.5 h-3.5" />
              Mark as read
            </button>
            <button
              onClick={handleContinue}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold text-white transition-all hover:opacity-90 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #f1889b, #e86c84)' }}
            >
              {isLast ? 'Got it' : 'Continue'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}