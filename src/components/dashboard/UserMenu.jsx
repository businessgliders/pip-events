import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';

function getInitials(name, email) {
  const source = (name || email || '').trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function UserMenu() {
  const { user } = useAuth();
  if (!user) return null;

  const initials = getInitials(user.full_name, user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-white/60"
          style={{ background: '#f1899b' }}
          title={user.full_name || user.email}
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="py-2">
          <div className="text-sm font-semibold truncate" style={{ color: '#5a3535' }}>
            {user.full_name || 'User'}
          </div>
          <div className="text-xs font-normal truncate" style={{ color: '#7a5555' }}>
            {user.email}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => base44.auth.logout()}
          className="cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}