import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export function fillTemplate(text, vars) {
  if (!text) return '';
  let out = text;
  for (const [k, v] of Object.entries(vars || {})) {
    out = out.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), v ?? '');
  }
  return out;
}

export default function TemplatePicker({ ticket, currentUser, onSelect }) {
  const { data: templates = [] } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => base44.entities.EmailTemplate.list('-created_date', 100),
  });

  const active = templates.filter(t => t.is_active !== false);

  const vars = {
    client_name: ticket.full_name || '',
    client_first_name: (ticket.full_name || '').split(' ')[0] || '',
    client_email: ticket.email || '',
    client_phone: ticket.phone || '',
    inquiry_type: ticket.event_type || '',
    ticket_id: `#${ticket.ticket_number || ticket.id.slice(-8)}`,
    staff_name: currentUser?.full_name || '',
    staff_first_name: (currentUser?.full_name || '').split(' ')[0] || '',
    staff_email: currentUser?.email || '',
    name: ticket.full_name || '',
    email: ticket.email || '',
    event_type: ticket.event_type || '',
    event_date: ticket.event_date || '',
    status: ticket.status || '',
  };

  // Group by category (default "General")
  const groups = active.reduce((acc, t) => {
    const cat = t.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const handleSelect = (t) => {
    onSelect({
      subject: fillTemplate(t.subject, vars),
      body_html: fillTemplate(t.body_html || t.body || '', vars),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
          style={{ background: 'rgba(220,200,205,0.2)', border: '1px solid rgba(220,200,205,0.5)', color: '#b67651' }}
        >
          <FileText className="w-3.5 h-3.5" /> Templates <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end">
        {active.length === 0 ? (
          <div className="px-3 py-4 text-xs text-center" style={{ color: '#9a7070' }}>
            No templates yet. Create them in Settings.
          </div>
        ) : (
          Object.entries(groups).map(([cat, list], idx) => (
            <div key={cat}>
              {idx > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs uppercase tracking-wide" style={{ color: '#c48a96' }}>{cat}</DropdownMenuLabel>
              {list.map(t => (
                <DropdownMenuItem key={t.id} onClick={() => handleSelect(t)} className="cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#6b4e4e' }}>{t.name}</p>
                    <p className="text-xs truncate" style={{ color: '#9a7070' }}>{t.subject}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}