import { Search, Archive } from 'lucide-react';
import UserMenu from './UserMenu';
import { useAuth } from '@/lib/AuthContext';

function getInitials(name, email) {
  const source = (name || email || '').trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

/**
 * iOS-style bottom tab bar (mobile + tablet only).
 * Reserves safe-area space for the home indicator via env(safe-area-inset-bottom).
 * Home (logo), Search, Archived, Profile (UserMenu context menu).
 */
export default function MobileTabBar({ activeView, searchActive = false, onHome, onFocusSearch, onArchive }) {
  const { user } = useAuth();
  const initials = user ? getInitials(user.full_name, user.email) : '?';
  const items = [
    {
      key: 'home',
      label: 'Home',
      type: 'logo',
      active: activeView === 'board' && !searchActive,
      onClick: onHome,
    },
    {
      key: 'search',
      label: 'Search',
      Icon: Search,
      active: searchActive,
      onClick: onFocusSearch,
    },
    {
      key: 'archive',
      label: 'Archive',
      Icon: Archive,
      active: activeView === 'archive',
      onClick: onArchive,
    },
  ];

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/85 border-t border-white/60"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      }}
    >
      <div className="flex items-end justify-around px-2 pt-1 pb-0.5 max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.Icon;
          const color = item.active ? '#e86c84' : '#8a6a6a';
          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className="flex flex-col items-center justify-end gap-0.5 px-3 py-0.5 transition-colors active:scale-95"
              style={{ color }}
            >
              {item.type === 'logo' ? (
                <img
                  src="https://media.base44.com/images/public/69b4780e4278ece8feeae352/e21e4f4e1_pip-events.png"
                  alt=""
                  className="w-6 h-6 rounded-md object-cover"
                />
              ) : (
                <Icon className="w-6 h-6" strokeWidth={item.active ? 2.5 : 2} />
              )}
              <span className="text-[10px] font-semibold tracking-tight leading-none">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Profile — entire cell is the tap target (44×44 minimum) */}
        <UserMenu>
          <button
            type="button"
            className="flex flex-col items-center justify-end gap-0.5 px-3 py-0.5 transition-colors active:scale-95 min-h-[44px] min-w-[44px] focus:outline-none"
            style={{ color: '#8a6a6a' }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
              style={{ background: '#f1899b' }}
              aria-hidden="true"
            >
              {initials}
            </span>
            <span className="text-[10px] font-semibold tracking-tight leading-none">
              Profile
            </span>
          </button>
        </UserMenu>
      </div>
    </div>
  );
}