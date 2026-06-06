import { Search, Archive } from 'lucide-react';
import UserMenu from './UserMenu';

/**
 * iOS-style bottom tab bar (mobile + tablet only).
 * Reserves safe-area space for the home indicator via env(safe-area-inset-bottom).
 * Home (logo), Search, Archived, Profile (UserMenu context menu).
 */
export default function MobileTabBar({ activeView, onHome, onFocusSearch, onArchive }) {
  const items = [
    {
      key: 'home',
      label: 'Home',
      type: 'logo',
      active: activeView === 'board',
      onClick: onHome,
    },
    {
      key: 'search',
      label: 'Search',
      Icon: Search,
      active: false,
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
      <div className="flex items-end justify-around px-2 pt-1.5 pb-1 max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.Icon;
          const color = item.active ? '#e86c84' : '#8a6a6a';
          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className="flex flex-col items-center justify-end gap-1 px-3 pt-1 pb-0.5 transition-colors active:scale-95"
              style={{ color }}
            >
              {item.type === 'logo' ? (
                <img
                  src="https://media.base44.com/images/public/69b4780e4278ece8feeae352/719e48f6d_1e65b0238_PiPEvents.png"
                  alt=""
                  className={`w-6 h-6 rounded-md object-cover ${item.active ? 'ring-2 ring-offset-1' : ''}`}
                  style={item.active ? { '--tw-ring-color': '#e86c84' } : undefined}
                />
              ) : (
                <Icon className="w-[22px] h-[22px]" strokeWidth={item.active ? 2.5 : 2} />
              )}
              <span className="text-[10px] font-semibold tracking-tight leading-none">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Profile — UserMenu provides the dropdown context menu */}
        <div className="flex flex-col items-center justify-end gap-1 px-3 pt-1 pb-0.5">
          <UserMenu />
          <span className="text-[10px] font-semibold tracking-tight leading-none" style={{ color: '#8a6a6a' }}>
            Profile
          </span>
        </div>
      </div>
    </div>
  );
}