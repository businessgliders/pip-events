import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '../components/layout/Navbar';
import HlsVideo from '../components/HlsVideo';
import { Info, Cake, Flower2, Wine, Briefcase, PersonStanding, Sparkles, ChevronRight, ChevronLeft, Check } from 'lucide-react';

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

const STEPS = [
  { label: 'Event Details', icon: Cake },
  { label: 'Classes & Add-Ons', icon: Sparkles },
  { label: 'Contact & Budget', icon: Flower2 },
];

const glassCard = {
  background: 'rgba(255,255,255,0.6)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 8px 32px rgba(241,136,155,0.1)',
};

const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white/70 placeholder-gray-400 focus:ring-pink-200";

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0" style={{background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)'}}>
          <Icon className="w-4 h-4" style={{color: '#e86c84'}} />
        </span>
        <h2 className="text-xl font-bold" style={{color: '#b67651'}}>{title}</h2>
      </div>
      {subtitle && <p className="text-sm ml-10" style={{color: '#c48a96'}}>{subtitle}</p>}
    </div>
  );
}

export default function RequestForm() {
  const params = new URLSearchParams(window.location.search);
  const preDate = params.get('date') || '';
  const preType = params.get('eventType') || '';

  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const topRef = useRef(null);

  const handleContinue = () => {
    if (!canContinue || advancing) return;
    setAdvancing(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setAdvancing(false);
      // Scroll smoothly to top of form after the new step renders
      requestAnimationFrame(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }, 450);
  };
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    event_type: preType,
    event_date: preDate,
    additional_dates: '',
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
    ? ['2 Hours', '3 Hours', '4 Hours']
    : form.time_slot === 'Non-Peak Hours (Mon-Thu, 12:30-3:30PM)'
    ? ['2 Hours', '3 Hours']
    : [];

  // Format validators
  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
  const isValidPhone = (p) => p.replace(/\D/g, '').length >= 10;
  const emailError = form.email.trim() && !isValidEmail(form.email);
  const phoneError = form.phone.trim() && !isValidPhone(form.phone);

  // Per-step validity
  const step1Valid = !!form.event_type && !!form.event_date && !!form.number_of_guests && !!form.time_slot && !!form.duration;
  const step2Valid = form.selected_classes.length > 0;
  const step3Valid = !!form.full_name.trim() && isValidPhone(form.phone) && isValidEmail(form.email) && !!form.budget.trim();
  const canContinue = step === 0 ? step1Valid : step === 1 ? step2Valid : true;
  const canSubmit = step1Valid && step2Valid && step3Valid;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const savedForm = {
      ...form,
      number_of_guests: parseInt(form.number_of_guests) || 0,
      status: 'New',
    };
    await base44.entities.EventRequest.create(savedForm);
    await base44.functions.invoke('sendEventEmails', { form: savedForm });
    setSubmitting(false);
    navigate('/Confirmation', { state: { name: form.full_name, email: form.email, eventType: form.event_type } });
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Video */}
      <HlsVideo
        src="https://video.squarespace-cdn.com/content/v1/6876866bd3fbe434b6566570/5e57b3a9-5624-4a07-b555-c3847af04b51/playlist.m3u8"
        className="fixed inset-0 w-full h-full object-cover"
        style={{zIndex: 0, filter: 'blur(6px)', transform: 'scale(1.05)'}}
      />
      {/* Pink overlay — stronger to calm the blurred video */}
      <div className="fixed inset-0" style={{
        zIndex: 1,
        background: 'rgba(248, 210, 220, 0.85)',
      }} />
      {/* Content */}
      <div className="relative" style={{zIndex: 2}}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-10">
        <div ref={topRef} />

        {/* Page Header */}
        <div className="text-center mb-4">
          <div className="inline-block rounded-xl px-5 py-3" style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 4px 20px rgba(241,136,155,0.12)',
          }}>
            <h1 className="text-xl font-bold" style={{color: '#b67651'}}>Book Your Special Event</h1>
            <p className="text-xs" style={{color: '#c48a96'}}>We're thrilled you're considering us for your special occasion.</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center mb-4 rounded-xl px-3 py-2 w-full" style={{
          background: 'rgba(255,255,255,0.35)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.45)',
        }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={i} className="flex items-center flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0"
                    style={{
                      background: isDone || isActive ? 'linear-gradient(135deg, #f1889b, #e86c84)' : 'rgba(255,255,255,0.7)',
                      border: isDone || isActive ? 'none' : '2px solid rgba(247,177,189,0.6)',
                      boxShadow: isActive ? '0 4px 16px rgba(241,136,155,0.4)' : 'none',
                    }}
                  >
                    {isDone
                      ? <Check className="w-3.5 h-3.5 text-white" />
                      : <Icon className="w-3.5 h-3.5" style={{color: isActive ? 'white' : '#c48a96'}} />
                    }
                  </div>
                  <span className="text-xs font-semibold truncate" style={{color: isActive || isDone ? '#e86c84' : '#c4909a'}}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 rounded-full transition-all duration-300"
                    style={{background: i < step ? 'linear-gradient(90deg, #f1889b, #e86c84)' : 'rgba(247,177,189,0.4)'}} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="rounded-3xl p-8 md:p-10" style={glassCard}>

          {/* ── STEP 1 ── */}
          {step === 0 && (
            <div className="space-y-8">
              {/* Event Details */}
              <div>
                <SectionHeader icon={Cake} title="Event Details" subtitle="Tell us about your event" />
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 block mb-1.5">Event Type *</label>
                    <select required value={form.event_type} onChange={e => set('event_type', e.target.value)} className={inputClass}>
                      <option value="">Select event type</option>
                      {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 block mb-1.5">Event Date *</label>
                      <input required type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 block mb-1.5">Preferred Time(s)</label>
                      <input value={form.preferred_times} onChange={e => set('preferred_times', e.target.value)} className={inputClass} placeholder="e.g., 2:00 PM or afternoon" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 block mb-1.5">Additional Preferred Dates <span className="font-normal text-gray-400">(Optional)</span></label>
                    <input value={form.additional_dates} onChange={e => set('additional_dates', e.target.value)} className={inputClass} placeholder="e.g., June 15 or June 22" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 block mb-1.5">Number of Guests *</label>
                    <input type="number" min="1" value={form.number_of_guests} onChange={e => set('number_of_guests', e.target.value)} className={inputClass} placeholder="e.g., 12" />
                  </div>
                  <div className="flex items-start gap-2.5 rounded-xl p-3.5" style={{background: 'rgba(251,224,226,0.5)', border: '1px solid rgba(247,177,189,0.4)'}}>
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{color: '#f1889b'}} />
                    <p className="text-xs leading-relaxed" style={{color: '#9a5a6a'}}>
                      We have 9 reformers available per session. Each session lasts 50 minutes. For groups larger than 9, we'll book multiple sessions to accommodate everyone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t" style={{borderColor: 'rgba(247,177,189,0.3)'}} />

              {/* Booking Hours & Duration */}
              <div>
                <SectionHeader icon={Briefcase} title="Booking Hours & Duration" subtitle="Select your preferred time slot and event duration" />
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 block mb-3">Time Slot *</label>
                    <div className="space-y-3">
                      {[
                        { value: 'Non-Peak Hours (Mon-Thu, 12:30-3:30PM)', label: 'Non-Peak Hours', sub: 'Monday – Thursday, 12:30 PM – 3:30 PM' },
                        { value: 'Peak Hours (Fri-Sun, 10AM-6PM)', label: 'Peak Hours', sub: 'Friday – Sunday, 10:00 AM – 6:00 PM' },
                      ].map(slot => {
                        const selected = form.time_slot === slot.value;
                        return (
                          <label key={slot.value} className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
                            style={{
                              border: selected ? '1.5px solid #f1889b' : '1.5px solid rgba(220,200,205,0.5)',
                              background: selected ? 'rgba(241,136,155,0.08)' : 'rgba(255,255,255,0.5)',
                            }}>
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                              style={{borderColor: selected ? '#f1889b' : '#d4b8bb'}}>
                              {selected && <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: '#f1889b'}} />}
                            </div>
                            <input type="radio" name="time_slot" value={slot.value} checked={selected}
                              onChange={e => { set('time_slot', e.target.value); set('duration', ''); }} className="sr-only" />
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
                    <div className="flex gap-3 flex-wrap">
                      {['2 Hours', '3 Hours', '4 Hours'].map(d => {
                        const isPeakOnly = d === '4 Hours';
                        const isNonPeak = form.time_slot === 'Non-Peak Hours (Mon-Thu, 12:30-3:30PM)';
                        const disabled = isPeakOnly && (isNonPeak || !form.time_slot);
                        const sel = form.duration === d && !disabled;
                        return (
                          <label key={d}
                            className="flex items-center gap-2.5 px-5 py-3 rounded-xl transition-all"
                            style={{
                              border: sel ? '1.5px solid #f1889b' : '1.5px solid rgba(220,200,205,0.5)',
                              background: sel ? 'rgba(241,136,155,0.08)' : 'rgba(255,255,255,0.5)',
                              opacity: disabled ? 0.4 : 1,
                              cursor: disabled ? 'not-allowed' : 'pointer',
                            }}>
                            <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                              style={{borderColor: sel ? '#f1889b' : '#d4b8bb'}}>
                              {sel && <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#f1889b'}} />}
                            </div>
                            <input type="radio" name="duration" value={d} checked={sel} disabled={disabled}
                              onChange={e => !disabled && set('duration', e.target.value)} className="sr-only" />
                            <span className="text-sm font-medium" style={{color: sel ? '#f1889b' : '#6b4e4e'}}>{d}</span>
                            {isPeakOnly && <span className="text-xs ml-1" style={{color: '#c4909a'}}>(Peak only)</span>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 1 && (
            <div className="space-y-8">
              {/* Class Selection */}
              <div>
                <SectionHeader icon={PersonStanding} title="Class Selection *" subtitle="Choose the classes you'd like, or pick 'Help me choose'" />

                {/* Help me choose */}
                {(() => {
                  const helpChecked = form.selected_classes.includes('Help me choose');
                  return (
                    <label className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all mb-4"
                      style={{
                        border: helpChecked ? '1.5px solid #f1889b' : '1.5px dashed rgba(241,136,155,0.5)',
                        background: helpChecked ? 'rgba(241,136,155,0.08)' : 'rgba(251,224,226,0.2)',
                      }}>
                      <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                        style={{background: helpChecked ? '#f1889b' : 'white', border: helpChecked ? 'none' : '1.5px solid #d4b8bb'}}>
                        {helpChecked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <input type="checkbox" checked={helpChecked}
                        onChange={() => {
                          if (!helpChecked) setForm(f => ({ ...f, selected_classes: ['Help me choose'] }));
                          else setForm(f => ({ ...f, selected_classes: [] }));
                        }} className="sr-only" />
                      <div>
                        <p className="text-sm font-semibold" style={{color: helpChecked ? '#f1889b' : '#6b4e4e'}}>✨ Help me choose</p>
                        <p className="text-xs mt-0.5" style={{color: '#a07878'}}>Not sure? Our team will suggest the best classes for your group</p>
                      </div>
                    </label>
                  );
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5" style={{opacity: form.selected_classes.includes('Help me choose') ? 0.4 : 1, pointerEvents: form.selected_classes.includes('Help me choose') ? 'none' : 'auto'}}>
                  {CLASS_OPTIONS.map(c => {
                    const checked = form.selected_classes.includes(c.name);
                    return (
                      <label key={c.name} className="flex items-center gap-3.5 p-4 rounded-xl cursor-pointer transition-all"
                        style={{
                          border: checked ? '1.5px solid #f1889b' : '1.5px solid rgba(220,200,205,0.4)',
                          background: checked ? 'rgba(241,136,155,0.06)' : 'rgba(255,255,255,0.4)',
                        }}>
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                          style={{background: checked ? '#f1889b' : 'white', border: checked ? 'none' : '1.5px solid #d4b8bb'}}>
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <input type="checkbox" checked={checked} onChange={() => toggleArray('selected_classes', c.name)} className="sr-only" />
                        <div>
                          <p className="text-sm font-semibold" style={{color: checked ? '#f1889b' : '#6b4e4e'}}>{c.name}</p>
                          <p className="text-xs mt-0.5" style={{color: '#a07878'}}>{c.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="border-t" style={{borderColor: 'rgba(247,177,189,0.3)'}} />

              {/* Add-Ons */}
              <div>
                <SectionHeader icon={Sparkles} title="Add-Ons" subtitle="Enhance your event experience" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {ADDON_OPTIONS.map(a => {
                    const checked = form.add_ons.includes(a.name);
                    return (
                      <label key={a.name} className="flex items-center gap-3.5 p-4 rounded-xl cursor-pointer transition-all"
                        style={{
                          border: checked ? '1.5px solid #f1889b' : '1.5px solid rgba(220,200,205,0.4)',
                          background: checked ? 'rgba(241,136,155,0.06)' : 'rgba(255,255,255,0.4)',
                        }}>
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                          style={{background: checked ? '#f1889b' : 'white', border: checked ? 'none' : '1.5px solid #d4b8bb'}}>
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <input type="checkbox" checked={checked} onChange={() => toggleArray('add_ons', a.name)} className="sr-only" />
                        <div>
                          <p className="text-sm font-semibold" style={{color: checked ? '#f1889b' : '#6b4e4e'}}>{a.name}</p>
                          <p className="text-xs mt-0.5" style={{color: '#a07878'}}>{a.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 2 && (
            <div className="space-y-8">
              {/* Contact Information */}
              <div>
                <SectionHeader icon={Flower2} title="Contact Information" subtitle="How can we reach you?" />
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 block mb-1.5">Full Name *</label>
                    <input required value={form.full_name} onChange={e => set('full_name', e.target.value)} className={inputClass} placeholder="Your full name" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 block mb-1.5">Phone Number *</label>
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={e => set('phone', e.target.value)}
                        className={inputClass}
                        placeholder="(555) 000-0000"
                        style={phoneError ? {borderColor: '#e86c84'} : undefined}
                      />
                      {phoneError && (
                        <p className="text-xs mt-1" style={{color: '#e86c84'}}>Please enter a valid phone number (at least 10 digits).</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 block mb-1.5">Email Address *</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                        className={inputClass}
                        placeholder="you@email.com"
                        style={emailError ? {borderColor: '#e86c84'} : undefined}
                      />
                      {emailError && (
                        <p className="text-xs mt-1" style={{color: '#e86c84'}}>Please enter a valid email address.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t" style={{borderColor: 'rgba(247,177,189,0.3)'}} />

              {/* Budget & Notes */}
              <div>
                <SectionHeader icon={Wine} title="Budget & Additional Information" subtitle="Help us plan the perfect event for you" />
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 block mb-1.5">Budget Range *</label>
                    <input required value={form.budget} onChange={e => set('budget', e.target.value)} className={inputClass} placeholder="e.g., $500 – $800" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 block mb-1.5">Additional Notes / Special Requests (Optional)</label>
                    <textarea rows={4} value={form.notes} onChange={e => set('notes', e.target.value)}
                      className={`${inputClass} resize-none`} placeholder="Any special requests, themes, or questions for our team..." />
                  </div>
                </div>
              </div>

              {/* Please Note */}
              <div className="rounded-2xl p-6" style={{background: 'rgba(251,224,226,0.45)', border: '1px solid rgba(247,177,189,0.4)'}}>
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
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t" style={{borderColor: 'rgba(247,177,189,0.3)'}}>
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-0 disabled:pointer-events-none"
              style={{border: '1.5px solid rgba(247,177,189,0.6)', color: '#b67651', background: 'rgba(255,255,255,0.5)'}}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < 2 ? (
              <button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue || advancing}
                title={!canContinue ? 'Please complete all required fields' : ''}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{background: 'linear-gradient(135deg, #f1889b, #e86c84)', boxShadow: '0 6px 20px rgba(241,136,155,0.35)'}}
              >
                {advancing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>Continue <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !canSubmit}
                title={!canSubmit ? 'Please complete all required fields' : ''}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{background: submitting ? '#f7b1bd' : 'linear-gradient(135deg, #f1889b, #e86c84)', boxShadow: '0 6px 20px rgba(241,136,155,0.35)'}}
              >
                {submitting ? 'Submitting...' : 'Submit Request'} {!submitting && <Check className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
      </div>{/* end content wrapper */}
    </div>
  );
}