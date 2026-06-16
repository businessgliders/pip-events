import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Sparkles } from 'lucide-react';

const SESSION_KEY = 'pip_inbox_migration_seen_v1';
const INBOX_URL = 'https://inbox.pilatesinpinkstudio.com/';
const SHOWCASE_IMAGE = 'https://media.base44.com/images/public/69b4780e4278ece8feeae352/a4faeed41_CleanShot2026-06-15at1947302x.png';
const APP_ICON = 'https://media.base44.com/images/public/69b4780e4278ece8feeae352/e21e4f4e1_pip-events.png';

export default function PiPInboxMigrationPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        setOpen(true);
      }
    } catch (_e) {
      setOpen(true);
    }
  }, []);

  const markSeen = () => {
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (_e) { /* noop */ }
    setOpen(false);
  };

  const handleTryNow = () => {
    window.open(INBOX_URL, '_blank', 'noopener,noreferrer');
    markSeen();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            background: 'rgba(20, 10, 15, 0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={markSeen}
        >
          <motion.div
            className="relative w-full max-w-md max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-[#f1899b] via-[#f7b1bd] to-[#fbe0e2]"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={markSeen}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(10px)',
              }}
              aria-label="Close"
            >
              <X className="w-4 h-4" style={{ color: '#7a4a3a' }} />
            </button>

            {/* Showcase image — edge-to-edge */}
            <div className="relative">
              <img
                src={SHOWCASE_IMAGE}
                alt="PiP Inbox"
                className="w-full h-44 object-cover object-center"
              />
              {/* New badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                style={{
                  background: 'linear-gradient(135deg, #e86c84, #b94965)',
                  boxShadow: '0 4px 12px rgba(184,73,101,0.4)',
                }}
              >
                <Sparkles className="w-3 h-3" />
                New
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pt-5 pb-5">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={APP_ICON}
                  alt="PiP Inbox"
                  className="w-10 h-10 rounded-xl object-cover shadow-md"
                />
                <div>
                  <h2 className="text-lg font-bold leading-tight" style={{ color: '#5a2a3a' }}>
                    Try the new PiP Inbox
                  </h2>
                  <p className="text-[11px] font-medium" style={{ color: '#9a4d63' }}>
                    Your events board has a new home
                  </p>
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-5" style={{ color: '#6b3a4a' }}>
                We've upgraded the Request Board into a unified inbox — all your event
                conversations, support, and influencer threads in one place.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={markSeen}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all hover:bg-white/40"
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    color: '#7a3a4f',
                    border: '1px solid rgba(255,255,255,0.5)',
                  }}
                >
                  Continue existing
                </button>
                <button
                  onClick={handleTryNow}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #e86c84, #b94965)',
                    boxShadow: '0 8px 20px rgba(184,73,101,0.35)',
                  }}
                >
                  Try now <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}