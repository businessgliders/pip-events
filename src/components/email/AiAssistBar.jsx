import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Lightbulb, RefreshCw, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AiAssistBar({ ticketId, onApply, showDescribe, showSuggest }) {
  if (!showDescribe && !showSuggest) return null;
  return (
    <div className="space-y-3 mt-3">
      {showDescribe && <DescribePanel ticketId={ticketId} onApply={onApply} />}
      {showSuggest && <SuggestPanel ticketId={ticketId} onApply={onApply} />}
    </div>
  );
}

function DescribePanel({ ticketId, onApply }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const res = await base44.functions.invoke('aiEmailAssist', {
      mode: 'compose',
      ticket_id: ticketId,
      description: text,
    });
    setLoading(false);
    if (res?.data?.body_html) {
      onApply(res.data.body_html);
      setText('');
    }
  };

  return (
    <div className="rounded-xl p-3" style={{ background: 'linear-gradient(135deg,#f5f3ff,#fce7f3)', border: '1px solid #e9d5ff' }}>
      <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: '#7c3aed' }}>
        <Sparkles className="w-3.5 h-3.5" /> Describe your reply in simple words
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
        placeholder="e.g. confirm Saturday June 14 at 2pm works, ask if they want the floral add-on"
        className="w-full text-sm px-3 py-2 rounded-lg focus:outline-none resize-none"
        style={{ background: 'white', border: '1px solid #e9d5ff', color: '#4a3838' }}
      />
      <button
        onClick={handleGenerate}
        disabled={loading || !text.trim()}
        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        {loading ? 'Generating…' : 'Generate'}
      </button>
    </div>
  );
}

function SuggestPanel({ ticketId, onApply }) {
  const [suggestions, setSuggestions] = useState([]);
  const [meta, setMeta] = useState({ cached: false, generated_at: null });
  const [loading, setLoading] = useState(false);

  const load = async (forceRefresh = false) => {
    setLoading(true);
    const res = await base44.functions.invoke('aiEmailAssist', {
      mode: 'suggest',
      ticket_id: ticketId,
      force_refresh: forceRefresh,
    });
    setLoading(false);
    if (res?.data?.suggestions) {
      setSuggestions(res.data.suggestions);
      setMeta({ cached: res.data.cached, generated_at: res.data.generated_at });
    }
  };

  useEffect(() => { load(false); }, [ticketId]);

  return (
    <div className="rounded-xl p-3" style={{ background: 'linear-gradient(135deg,#f5f3ff,#fce7f3)', border: '1px solid #e9d5ff' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#7c3aed' }}>
          <Lightbulb className="w-3.5 h-3.5" /> Suggested replies
          {meta.generated_at && (
            <span className="ml-2 text-[10px] font-normal" style={{ color: '#9a7070' }}>
              {meta.cached ? 'Cached · ' : 'Fresh · '}
              generated {formatDistanceToNow(new Date(meta.generated_at), { addSuffix: true })}
            </span>
          )}
        </p>
        <button
          onClick={() => load(true)}
          disabled={loading}
          title="Re-generate (uses AI credits)"
          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full transition-all disabled:opacity-50"
          style={{ background: 'white', border: '1px solid #e9d5ff', color: '#7c3aed' }}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading && suggestions.length === 0 ? (
        <div className="flex items-center gap-2 text-xs py-4" style={{ color: '#9a7070' }}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
        </div>
      ) : suggestions.length === 0 ? (
        <p className="text-xs py-2" style={{ color: '#9a7070' }}>No suggestions yet.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onApply(s.body_html)}
              className="flex-shrink-0 w-64 text-left rounded-lg p-2.5 hover:shadow-md transition-all"
              style={{ background: 'white', border: '1px solid #e9d5ff' }}
            >
              <p className="text-xs font-bold mb-1" style={{ color: '#7c3aed' }}>{s.label}</p>
              <div
                className="text-xs leading-snug line-clamp-3"
                style={{ color: '#4a3838' }}
                dangerouslySetInnerHTML={{ __html: s.body_html }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}