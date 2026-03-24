import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '../components/layout/Navbar';
import { Info, Cake, Flower2, Wine, Briefcase, PersonStanding, Sparkles } from 'lucide-react';

const EVENT_TYPE_ICONS = {
  'Birthday': Cake,
  'Bridal Shower': Flower2,
  'Bachelorette Party': Wine,
  'Corporate Wellness Event': Briefcase,
  'Private Class': PersonStanding,
  'Other': Sparkles,
};

const CLASS_OPTIONS = [
  { name: 'Power in Pink Sculpt', desc: 'High-energy, full-body toning' },
  { name: 'Core + Blush', desc: 'Core strength + stability focused' },
  { name: 'Pink Pilates Flow', desc: 'A balanced, all-levels class with smooth transitions' },
  { name: 'Reformer Basics', desc: 'Intro to reformer for all fitness levels' },
  { name: 'Stretch & Glow', desc: 'Flexibility, recovery and glow' },
];

const ADDON_OPTIONS = [
  { name: 'Sparkling Water & Snacks', desc: 'Refreshments for your group' },
  { name: 'Studio Décor Package', desc: 'Themed decorations, custom signage, balloons & 1 bottle of champagne (21+ only)' },
  { name: 'Photography Add-On', desc: 'Professional photos of your event' },
  { name: 'Custom Playlist', desc: 'Curated music for your vibe' },
  { name: 'Extra Mats & Towels', desc: 'Additional equipment for your guests' },
];

const EVENT_TYPES = ['Birthday', 'Bridal Shower', 'Bachelorette Party', 'Corporate Wellness Event', 'Private Class', 'Other'];

const glassCard = {
  background: 'rgba(255,255,255,0.6)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 8px 32px rgba(241,136,155,0.1)',
};

const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white/70 placeholder-gray-400";
const inputFocus = "focus:ring-pink-200";

export default function RequestForm() {
  const params = new URLSearchParams(window.location.search);
  const preDate = params.get('date') || '';
  const preType = params.get('eventType') || '';

  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    event_type: preType,
    event_date: preDate,
    preferred_times: '',
    number_of_guests: '',
    time_slot: '',
    duration: '',
    selected_classes: [],
    add_ons: [],
    notes: '',
    budget: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleArray = (key, val) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }));
  };

  const durationOptions = form.time_slot === 'Peak Hours (Fri-Sun, 10AM-6PM)'
    ? ['2 Hours', '4 Hours']
    : ['2 Hours'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const savedForm = {
      ...form,
      number_of_guests: parseInt(form.number_of_guests) || 0,
      status: 'Pending',
    };

    await base44.entities.EventRequest.create(savedForm);
    await base44.functions.invoke('sendEventEmails', { form: savedForm });

    setSubmitting(false);
    navigate('/Confirmation', { state: { name: form.full_name, email: form.email, eventType: form.event_type } });
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #fce4ec 0%, #fdf5f7 60%, #fce4ec 100%)'}}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2" style={{color: '#b67651'}}>Book Your Special Event</h1>
          <p className="text-base mb-4" style={{color: '#c48a96'}}>We're thrilled you're considering us for your special occasion.</p>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium" style={{
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(247,177,189,0.5)',
            color: '#f1889b',
          }}>
            ✨ Let's create something beautiful together
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Event Details */}
          <section className="rounded-2xl p-6" style={glassCard}>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full" style={{background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)'}}><Cake className="w-4 h-4" style={{color: '#e86c84'}} /></span>
              <h2 className="text-lg font-bold" style={{color: '#b67651'}}>Event Details</h2>
            </div>
            <p className="text-sm mb-5" style={{color: '#c48a96'}}>Tell us about your event</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1.5">Event Type *</label>
                <select required value={form.event_type} onChange={e => set('event_type', e.target.value)}
                  className={`${inputClass} ${inputFocus} bg-white/70`}>
                  <option value="">Select event type</option>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1.5">Event Date *</label>
                  <input required type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)}
                    className={`${inputClass} ${inputFocus}`} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1.5">Preferred Time(s) *</label>
                  <input value={form.preferred_times} onChange={e => set('preferred_times', e.target.value)}
                    className={`${inputClass} ${inputFocus}`} placeholder="e.g., 2:00 PM or afternoon" />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1.5">Number of Guests *</label>
                <input type="number" min="1" value={form.number_of_guests} onChange={e => set('number_of_guests', e.target.value)}
                  className={`${inputClass} ${inputFocus}`} placeholder="e.g., 12" />
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2.5 rounded-xl p-3.5" style={{background: 'rgba(251,224,226,0.5)', border: '1px solid rgba(247,177,189,0.4)'}}>
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{color: '#f1889b'}} />
                <p className="text-xs leading-relaxed" style={{color: '#9a5a6a'}}>
                  We have 9 reformers available per session. Each session lasts 50 minutes. For groups larger than 9, we'll book multiple sessions to accommodate everyone.
                </p>
              </div>
            </div>
          </section>

          {/* Booking Hours & Duration */}
          <section className="rounded-2xl p-6" style={glassCard}>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full" style={{background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)'}}><Briefcase className="w-4 h-4" style={{color: '#e86c84'}} /></span>
              <h2 className="text-lg font-bold" style={{color: '#b67651'}}>Booking Hours & Duration</h2>
            </div>
            <p className="text-sm mb-5" style={{color: '#c48a96'}}>Select your preferred time slot and event duration</p>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-3">Time Slot *</label>
                <div className="space-y-3">
                  {[
                    { value: 'Non-Peak Hours (Mon-Thu, 12:30-3:30PM)', label: 'Non-Peak Hours', sub: 'Monday – Thursday, 12:30 PM – 3:30 PM' },
                    { value: 'Peak Hours (Fri-Sun, 10AM-6PM)', label: 'Peak Hours', sub: 'Friday – Sunday, 10:00 AM – 6:00 PM' },
                  ].map(slot => {
                    const selected = form.time_slot === slot.value;
                    return (
                      <label
                        key={slot.value}
                        className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
                        style={{
                          border: selected ? '1.5px solid #f1889b' : '1.5px solid rgba(220,200,205,0.5)',
                          background: selected ? 'rgba(241,136,155,0.08)' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={{borderColor: selected ? '#f1889b' : '#d4b8bb'}}>
                          {selected && <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: '#f1889b'}} />}
                        </div>
                        <input
                          type="radio"
                          name="time_slot"
                          value={slot.value}
                          checked={selected}
                          onChange={e => { set('time_slot', e.target.value); set('duration', ''); }}
                          className="sr-only"
                        />
                        <div>
                          <p className="text-sm font-semibold" style={{color: selected ? '#f1889b' : '#6b4e4e'}}>{slot.label}</p>
                          <p className="text-xs mt-0.5" style={{color: '#a07878'}}>{slot.sub}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-3">Duration *</label>
                {!form.time_slot ? (
                  <p className="text-xs italic" style={{color: '#c4909a'}}>Please select a time slot first</p>
                ) : (
                  <div className="flex gap-3 flex-wrap">
                    {durationOptions.map(d => {
                      const sel = form.duration === d;
                      return (
                        <label
                          key={d}
                          className="flex items-center gap-2.5 px-5 py-3 rounded-xl cursor-pointer transition-all"
                          style={{
                            border: sel ? '1.5px solid #f1889b' : '1.5px solid rgba(220,200,205,0.5)',
                            background: sel ? 'rgba(241,136,155,0.08)' : 'rgba(255,255,255,0.5)',
                          }}
                        >
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{borderColor: sel ? '#f1889b' : '#d4b8bb'}}>
                            {sel && <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#f1889b'}} />}
                          </div>
                          <input type="radio" name="duration" value={d} checked={sel} onChange={e => set('duration', e.target.value)} className="sr-only" />
                          <span className="text-sm font-medium" style={{color: sel ? '#f1889b' : '#6b4e4e'}}>{d}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {form.time_slot && form.time_slot !== 'Peak Hours (Fri-Sun, 10AM-6PM)' && (
                  <p className="text-xs mt-2" style={{color: '#c4909a'}}>4-hour option is only available for Peak Hours (Fri–Sun)</p>
                )}
              </div>
            </div>
          </section>

          {/* Class Selection */}
          <section className="rounded-2xl p-6" style={glassCard}>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full" style={{background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)'}}><PersonStanding className="w-4 h-4" style={{color: '#e86c84'}} /></span>
              <h2 className="text-lg font-bold" style={{color: '#b67651'}}>Class Selection</h2>
            </div>
            <p className="text-sm mb-5" style={{color: '#c48a96'}}>Choose the classes you'd like for your event (select all that apply)</p>
            <div className="space-y-2">
              {CLASS_OPTIONS.map(c => {
                const checked = form.selected_classes.includes(c.name);
                return (
                  <label key={c.name} className="flex items-center gap-3.5 p-3.5 rounded-xl cursor-pointer transition-all"
                    style={{
                      border: checked ? '1.5px solid #f1889b' : '1.5px solid rgba(220,200,205,0.4)',
                      background: checked ? 'rgba(241,136,155,0.06)' : 'rgba(255,255,255,0.4)',
                    }}>
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                      style={{background: checked ? '#f1889b' : 'white', border: checked ? 'none' : '1.5px solid #d4b8bb'}}>
                      {checked && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <input type="checkbox" checked={checked} onChange={() => toggleArray('selected_classes', c.name)} className="sr-only" />
                    <div>
                      <p className="text-sm font-medium" style={{color: checked ? '#f1889b' : '#6b4e4e'}}>{c.name}</p>
                      <p className="text-xs mt-0.5" style={{color: '#a07878'}}>{c.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Add-Ons */}
          <section className="rounded-2xl p-6" style={glassCard}>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full" style={{background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)'}}><Sparkles className="w-4 h-4" style={{color: '#e86c84'}} /></span>
              <h2 className="text-lg font-bold" style={{color: '#b67651'}}>Add-Ons</h2>
            </div>
            <p className="text-sm mb-5" style={{color: '#c48a96'}}>Enhance your event experience</p>
            <div className="space-y-2">
              {ADDON_OPTIONS.map(a => {
                const checked = form.add_ons.includes(a.name);
                return (
                  <label key={a.name} className="flex items-center gap-3.5 p-3.5 rounded-xl cursor-pointer transition-all"
                    style={{
                      border: checked ? '1.5px solid #f1889b' : '1.5px solid rgba(220,200,205,0.4)',
                      background: checked ? 'rgba(241,136,155,0.06)' : 'rgba(255,255,255,0.4)',
                    }}>
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                      style={{background: checked ? '#f1889b' : 'white', border: checked ? 'none' : '1.5px solid #d4b8bb'}}>
                      {checked && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <input type="checkbox" checked={checked} onChange={() => toggleArray('add_ons', a.name)} className="sr-only" />
                    <div>
                      <p className="text-sm font-medium" style={{color: checked ? '#f1889b' : '#6b4e4e'}}>{a.name}</p>
                      <p className="text-xs mt-0.5" style={{color: '#a07878'}}>{a.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Contact Information */}
          <section className="rounded-2xl p-6" style={glassCard}>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full" style={{background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)'}}><Flower2 className="w-4 h-4" style={{color: '#e86c84'}} /></span>
              <h2 className="text-lg font-bold" style={{color: '#b67651'}}>Contact Information</h2>
            </div>
            <p className="text-sm mb-5" style={{color: '#c48a96'}}>How can we reach you?</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1.5">Full Name *</label>
                <input required value={form.full_name} onChange={e => set('full_name', e.target.value)}
                  className={`${inputClass} ${inputFocus}`} placeholder="Your full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1.5">Phone Number *</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)}
                    className={`${inputClass} ${inputFocus}`} placeholder="(555) 000-0000" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1.5">Email Address *</label>
                  <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    className={`${inputClass} ${inputFocus}`} placeholder="you@email.com" />
                </div>
              </div>
            </div>
          </section>

          {/* Budget & Notes */}
          <section className="rounded-2xl p-6" style={glassCard}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">💬</span>
              <h2 className="text-lg font-bold" style={{color: '#b67651'}}>Budget & Additional Information</h2>
            </div>
            <p className="text-sm mb-5" style={{color: '#c48a96'}}>Help us plan the perfect event for you</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1.5">Budget Range (Optional)</label>
                <input value={form.budget} onChange={e => set('budget', e.target.value)}
                  className={`${inputClass} ${inputFocus}`} placeholder="e.g., $500 – $800" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1.5">Additional Notes / Special Requests (Optional)</label>
                <textarea rows={4} value={form.notes} onChange={e => set('notes', e.target.value)}
                  className={`${inputClass} ${inputFocus} resize-none`} placeholder="Any special requests, themes, or questions for our team..." />
              </div>
            </div>
          </section>

          {/* Please Note */}
          <section className="rounded-2xl p-6" style={{
            background: 'rgba(251,224,226,0.45)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(247,177,189,0.4)',
          }}>
            <h3 className="text-sm font-bold mb-3" style={{color: '#b67651'}}>Please note:</h3>
            <ul className="space-y-2">
              {[
                'Each session accommodates up to 9 guests and lasts 50 minutes',
                'Booking is subject to studio availability and written confirmation',
                'Only in-house décor company is permitted for event decorations',
                'No outside food or catering is permitted in the studio',
              ].map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{color: '#9a5a6a'}}>
                  <span className="mt-0.5 flex-shrink-0" style={{color: '#f1889b'}}>•</span>
                  {note}
                </li>
              ))}
            </ul>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full disabled:opacity-60 text-white py-4 rounded-2xl font-semibold text-base transition-all shadow-lg"
            style={{
              background: submitting ? '#f7b1bd' : 'linear-gradient(135deg, #f1889b, #e86c84)',
              boxShadow: '0 8px 24px rgba(241,136,155,0.35)',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Event Request'}
          </button>
        </form>
      </div>
    </div>
  );
}