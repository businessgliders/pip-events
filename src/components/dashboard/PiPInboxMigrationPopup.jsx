import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SESSION_KEY = 'pip_inbox_migration_seen_v1';
const INBOX_URL = 'https://inbox.pilatesinpinkstudio.com/inbox#events';
const SHOWCASE_IMAGE = 'https://media.base44.com/images/public/69b4780e4278ece8feeae352/4fdbd3e5b_generated_image.png';
const APP_ICON = 'https://media.base44.com/images/public/69841af9c747b033a60780f2/8796f5d2d_IMG_0093.png';

export default function PiPInboxMigrationPopup() {
  const [open, setOpen] = useState(true);

  const handleTryNow = () => {
    window.open(INBOX_URL, '_blank', 'noopener,noreferrer');
    // Popup intentionally stays open after CTA click.
  };

  const handleSwitchAccount = async () => {
    try {
      await base44.auth.logout();
    } catch (_) {
      // Swallow — even if the SDK call fails we still want to redirect.
    }
    base44.auth.loginWithProvider(
      'google',
      `${window.location.origin}${window.location.pathname}`
    );
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
            background: 'rgba(20, 10, 15, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <motion.div
            className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl bg-white"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Showcase image — edge-to-edge with pink-tinted backdrop */}
            <div
              className="relative"
              style={{
                background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)',
              }}
            >
              <img
                src={SHOWCASE_IMAGE}
                alt="PiP Inbox"
                className="w-full h-44 object-cover object-center"
              />
            </div>

            {/* Content */}
            <div className="px-7 pt-6 pb-7 text-center">
              {/* Icon + NEW badge */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <img
                  src={APP_ICON}
                  alt="PiP Inbox icon"
                  className="w-10 h-10 rounded-xl object-cover shadow-sm"
                />
                <div
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    background: 'rgba(241,136,155,0.15)',
                    color: '#e86c84',
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  New
                </div>
              </div>

              <h2 className="text-2xl font-bold leading-tight mb-2" style={{ color: '#2a1a20' }}>
                Try the new Unified PiP Inbox
              </h2>

              <p className="text-sm leading-relaxed mb-6" style={{ color: '#7a6970' }}>
                PiP Inbox brings all your support, events, and influencer
                conversations into one beautiful place. Reply faster, stay organized,
                never miss a message.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleTryNow}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:scale-[1.03]"
                  style={{
                    background: 'linear-gradient(135deg, #f1889b, #e86c84)',
                    boxShadow: '0 8px 20px rgba(232,108,132,0.35)',
                  }}
                >
                  Try now <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSwitchAccount}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-colors border"
                  style={{
                    color: '#7a6970',
                    borderColor: 'rgba(122,105,112,0.25)',
                    background: 'white',
                  }}
                  title="Log out and sign in with a different Google account"
                >
                  <LogOut className="w-4 h-4" />
                  Switch account
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}