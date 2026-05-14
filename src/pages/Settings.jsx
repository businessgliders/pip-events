import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '../components/layout/Navbar';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Plus, Trash2, Save, Edit2, X, Check, ArrowLeft, Lock } from 'lucide-react';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b4780e4278ece8feeae352/86f0df21b_Pilatesinpinklogojusticon1.png';

const glassCard = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.65)',
  boxShadow: '0 8px 32px rgba(241,136,155,0.1)',
};

function getDefaultSignature() {
  return `<div style="display:flex;align-items:center;gap:12px;">
  <img src="${LOGO_URL}" width="40" height="40" style="border-radius:50%;object-fit:contain;" />
  <div>
    <p style="margin:0;font-weight:700;color:#b67651;font-size:14px;">Pilates in Pink™ Studio</p>
    <p style="margin:2px 0 0;color:#c48a96;font-size:12px;">info@pilatesinpinkstudio.com</p>
  </div>
</div>`;
}

export default function SettingsPage() {
  const { user, isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();
  const isAdmin = isAuthenticated && user?.role === 'admin';

  const { data: templates = [], refetch: refetchTemplates } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => base44.entities.EmailTemplate.list('-created_date', 50),
    enabled: isAdmin,
  });

  const { data: settingsRows = [], refetch: refetchSettings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list(),
    enabled: isAdmin,
  });

  // Signature
  const sigRecord = settingsRows.find(s => s.key === 'signature');
  const [signatureHtml, setSignatureHtml] = useState('');
  const [sigLoaded, setSigLoaded] = useState(false);
  const [savingSig, setSavingSig] = useState(false);

  if (isAdmin && !sigLoaded && settingsRows.length >= 0) {
    setSignatureHtml(sigRecord?.value || getDefaultSignature());
    setSigLoaded(true);
  }

  // Template form
  const [newName, setNewName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  const handleSaveSignature = async () => {
    setSavingSig(true);
    if (sigRecord) {
      await base44.entities.AppSettings.update(sigRecord.id, { value: signatureHtml });
    } else {
      await base44.entities.AppSettings.create({ key: 'signature', value: signatureHtml });
    }
    await refetchSettings();
    setSavingSig(false);
  };

  const handleSaveTemplate = async () => {
    if (!newName.trim() || !newSubject.trim() || !newBody.trim()) return;
    setSavingTemplate(true);
    await base44.entities.EmailTemplate.create({ name: newName, subject: newSubject, body: newBody });
    setNewName(''); setNewSubject(''); setNewBody('');
    await refetchTemplates();
    setSavingTemplate(false);
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete this template?')) return;
    await base44.entities.EmailTemplate.delete(id);
    refetchTemplates();
  };

  const handleStartEdit = (t) => {
    setEditingId(t.id);
    setEditName(t.name);
    setEditSubject(t.subject);
    setEditBody(t.body);
  };

  const handleSaveEdit = async () => {
    await base44.entities.EmailTemplate.update(editingId, { name: editName, subject: editSubject, body: editBody });
    setEditingId(null);
    refetchTemplates();
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #fce4ec 0%, #fdf5f7 60%, #fce4ec 100%)'}}>
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #fce4ec 0%, #fdf5f7 60%, #fce4ec 100%)'}}>
        <div className="w-full max-w-sm mx-4">
          <div className="flex justify-center mb-6">
            <img src={LOGO_URL} alt="Pilates in Pink" className="w-16 h-16 object-contain drop-shadow-sm" />
          </div>
          <div className="rounded-3xl p-10 text-center" style={glassCard}>
            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4" style={{background: 'rgba(241,136,155,0.15)'}}>
              <Lock className="w-5 h-5" style={{color: '#e86c84'}} />
            </div>
            <h2 className="text-2xl font-bold mb-1" style={{color: '#b67651'}}>Settings</h2>
            <p className="text-sm mb-7" style={{color: '#c48a96'}}>
              {isAuthenticated
                ? 'Admin access required. Please contact a studio administrator.'
                : 'Sign in with your admin account to continue.'}
            </p>
            {!isAuthenticated && (
              <button
                onClick={navigateToLogin}
                className="w-full text-white py-3 rounded-xl font-semibold text-sm"
                style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)'}}
              >Sign In</button>
            )}
            <button
              onClick={() => { window.history.length > 1 ? window.history.back() : (window.location.href = '/Dashboard'); }}
              className="w-full mt-3 text-xs font-medium py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
              style={{color: '#b67651'}}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #fce4ec 0%, #fdf5f7 60%, #fce4ec 100%)'}}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4 gap-3">
            <div className="inline-block rounded-2xl px-4 sm:px-6 py-3 sm:py-4" style={glassCard}>
              <h1 className="text-xl sm:text-2xl font-bold" style={{color: '#b67651'}}>Settings</h1>
              <p className="text-xs sm:text-sm mt-0.5" style={{color: '#c48a96'}}>Manage email templates and signature</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 self-start">
              <button
                onClick={() => { window.history.length > 1 ? window.history.back() : (window.location.href = '/Dashboard'); }}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all"
                style={{background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(247,177,189,0.5)', color: '#b67651'}}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => { window.location.href = '/RequestForm'; }}
                className="flex items-center gap-2 text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all"
                style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)', boxShadow: '0 4px 16px rgba(241,136,155,0.35)'}}
              >
                <Plus className="w-4 h-4" /> New Request
              </button>
            </div>
          </div>
        </div>

        {/* ── EMAIL TEMPLATES (moved above signature) ── */}
        <div className="rounded-2xl p-6" style={glassCard}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-base font-bold" style={{color: '#b67651'}}>Email Templates</span>
            <span className="text-xs rounded-full px-2 py-0.5" style={{background: 'rgba(241,136,155,0.1)', color: '#e86c84'}}>{templates.length} saved</span>
          </div>

          {/* Placeholders hint */}
          <div className="rounded-xl px-3 py-2.5 mb-5 text-xs" style={{background: 'rgba(251,224,226,0.3)', color: '#9a5a6a', border: '1px solid rgba(247,177,189,0.3)'}}>
            Use <code className="bg-white/80 px-1 rounded text-pink-500">{"{{name}}"}</code>, <code className="bg-white/80 px-1 rounded text-pink-500">{"{{event_type}}"}</code>, <code className="bg-white/80 px-1 rounded text-pink-500">{"{{event_date}}"}</code>, <code className="bg-white/80 px-1 rounded text-pink-500">{"{{status}}"}</code> as dynamic placeholders.
          </div>

          {/* New template form */}
          <div className="rounded-2xl p-5 mb-6" style={{background: 'rgba(241,136,155,0.04)', border: '1.5px dashed rgba(241,136,155,0.3)'}}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{color: '#c48a96'}}>New Template</p>
            <div className="space-y-3">
              <input
                value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Template name (e.g. Confirmation, Pricing Info...)"
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                style={{border: '1.5px solid rgba(220,200,205,0.6)', background: 'white'}}
              />
              <input
                value={newSubject} onChange={e => setNewSubject(e.target.value)}
                placeholder="Subject line"
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                style={{border: '1.5px solid rgba(220,200,205,0.6)', background: 'white'}}
              />
              <div className="rounded-xl overflow-hidden" style={{border: '1.5px solid rgba(220,200,205,0.6)'}}>
                <ReactQuill
                  value={newBody} onChange={setNewBody}
                  placeholder="Template body..."
                  modules={{ toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']] }}
                />
              </div>
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !newName || !newSubject || !newBody.replace(/<[^>]*>/g, '').trim()}
                className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)'}}
              >
                <Plus className="w-4 h-4" />
                {savingTemplate ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>

          {/* Existing templates */}
          {templates.length === 0 ? (
            <p className="text-sm text-center py-6" style={{color: '#d4b8bc'}}>No templates yet. Create your first one above.</p>
          ) : (
            <div className="space-y-3">
              {templates.map(t => (
                <div key={t.id} className="rounded-2xl p-4" style={{border: '1px solid rgba(247,177,189,0.3)', background: 'rgba(255,255,255,0.6)'}}>
                  {editingId === t.id ? (
                    <div className="space-y-3">
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{border: '1.5px solid rgba(220,200,205,0.6)'}} />
                      <input value={editSubject} onChange={e => setEditSubject(e.target.value)}
                        placeholder="Subject"
                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{border: '1.5px solid rgba(220,200,205,0.6)'}} />
                      <div className="rounded-xl overflow-hidden" style={{border: '1.5px solid rgba(220,200,205,0.6)'}}>
                        <ReactQuill value={editBody} onChange={setEditBody}
                          modules={{ toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']] }} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveEdit}
                          className="flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-xs font-semibold"
                          style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)'}}>
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium"
                          style={{border: '1.5px solid rgba(220,200,205,0.6)', color: '#b67651', background: 'white'}}>
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{color: '#6b4e4e'}}>{t.name}</p>
                        <p className="text-xs mt-0.5 truncate" style={{color: '#c48a96'}}>{t.subject}</p>
                        <div className="text-xs mt-1 line-clamp-2" style={{color: '#b09098'}}
                          dangerouslySetInnerHTML={{ __html: t.body.replace(/<[^>]*>/g, ' ').substring(0, 120) + '...' }} />
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => handleStartEdit(t)}
                          className="p-2 rounded-lg hover:bg-pink-50 transition-colors" style={{color: '#f1889b'}}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteTemplate(t.id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors" style={{color: '#e86c84'}}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── EMAIL SIGNATURE ── */}
        <div className="rounded-2xl p-6" style={glassCard}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base font-bold" style={{color: '#b67651'}}>Email Signature</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{background: 'rgba(241,136,155,0.1)', color: '#e86c84'}}>Appended to all outgoing emails</span>
          </div>

          <div className="mb-3">
            <p className="text-xs font-medium mb-2" style={{color: '#c48a96'}}>Preview</p>
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{background: 'rgba(251,224,226,0.2)', border: '1px solid rgba(247,177,189,0.3)'}}
              dangerouslySetInnerHTML={{ __html: signatureHtml }}
            />
          </div>

          <div className="rounded-xl overflow-hidden mb-3" style={{border: '1.5px solid rgba(220,200,205,0.6)'}}>
            <ReactQuill
              value={signatureHtml}
              onChange={setSignatureHtml}
              modules={{ toolbar: [['bold', 'italic', 'underline'], ['link'], [{ color: [] }], ['clean']] }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSignatureHtml(getDefaultSignature())}
              className="text-xs px-3 py-2 rounded-xl"
              style={{border: '1.5px solid rgba(220,200,205,0.6)', color: '#b67651', background: 'white'}}
            >Reset to Default</button>
            <button
              onClick={handleSaveSignature}
              disabled={savingSig}
              className="flex items-center gap-2 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
              style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)'}}
            >
              <Save className="w-3.5 h-3.5" />
              {savingSig ? 'Saving...' : 'Save Signature'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}