import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Navbar from '../components/layout/Navbar';
import { format } from 'date-fns';

const CLASS_OPTIONS = ['Power in Pink Sculpt', 'Core + Blush', 'Pink Pilates Flow', 'Reformer Basics', 'Stretch & Glow'];
const ADDON_OPTIONS = ['Sparkling Water & Snacks', 'Décor Setup', 'Photography Add-On', 'Custom Playlist', 'Extra Mats & Towels'];
const EVENT_TYPES = ['Birthday', 'Bridal Shower', 'Bachelorette Party', 'Corporate Wellness Event', 'Private Class', 'Other'];
const EVENT_ICONS = { Birthday: '🎂', 'Bridal Shower': '💐', 'Bachelorette Party': '🥂', 'Corporate Wellness Event': '💼', 'Private Class': '🧘', Other: '✨' };

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
    const record = await base44.entities.EventRequest.create({
      ...form,
      number_of_guests: parseInt(form.number_of_guests) || 0,
      status: 'Pending',
    });

    // Send confirmation email to submitter
    const emailBody = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#f9a8c9;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:white;margin:0;font-size:24px;">✨ Thank You, ${form.full_name}! ✨</h1>
  </div>
  <div style="background:white;padding:32px;border-radius:0 0 12px 12px;border:1px solid #f9e1ed;">
    <p style="color:#555;">We're thrilled that you're interested in hosting your <strong>${form.event_type}</strong> at Pilates in Pink Studio!</p>
    <div style="background:#fdf2f7;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #f472b6;">
      <h3 style="color:#ec4899;margin:0 0 12px 0;">📋 Your Request Summary</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:4px 0;color:#999;">Event Type:</td><td style="padding:4px 0;font-weight:600;color:#333;">${form.event_type}</td></tr>
        <tr><td style="padding:4px 0;color:#999;">Preferred Date:</td><td style="padding:4px 0;font-weight:600;color:#333;">${form.event_date}</td></tr>
        <tr><td style="padding:4px 0;color:#999;">Number of Guests:</td><td style="padding:4px 0;font-weight:600;color:#333;">${form.number_of_guests}</td></tr>
        <tr><td style="padding:4px 0;color:#999;">Duration:</td><td style="padding:4px 0;font-weight:600;color:#333;">${form.duration}</td></tr>
        ${form.time_slot ? `<tr><td style="padding:4px 0;color:#999;">Time Slot:</td><td style="padding:4px 0;font-weight:600;color:#333;">${form.time_slot}</td></tr>` : ''}
        ${form.selected_classes.length ? `<tr><td style="padding:4px 0;color:#999;">Classes:</td><td style="padding:4px 0;font-weight:600;color:#333;">${form.selected_classes.join(', ')}</td></tr>` : ''}
      </table>
    </div>
    <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #22c55e;">
      <h3 style="color:#16a34a;margin:0 0 12px 0;">✅ What Happens Next?</h3>
      <ol style="margin:0;padding-left:20px;color:#555;font-size:14px;line-height:1.8;">
        <li>Our team will review your request within <strong>24 hours</strong></li>
        <li>We'll check availability for your preferred dates</li>
        <li>You'll receive a personalized quote and booking details</li>
        <li>Once confirmed, we'll send you all the event details!</li>
      </ol>
    </div>
    <p style="color:#555;font-size:14px;">If you have any questions in the meantime, feel free to reply to this email or call us at your convenience.</p>
    <div style="text-align:center;margin-top:24px;padding-top:20px;border-top:1px solid #f9e1ed;">
      <p style="margin:4px 0;font-size:13px;color:#888;">📧 <a href="mailto:info@pilatesinpinkstudio.com" style="color:#ec4899;">info@pilatesinpinkstudio.com</a></p>
      <p style="margin:4px 0;font-size:13px;color:#888;">📍 Pilates in Pink Studio</p>
    </div>
    <p style="text-align:center;color:#f9a8c9;font-size:12px;margin-top:20px;">We can't wait to help you create an unforgettable experience! 💕</p>
  </div>
</div>`;

    await base44.integrations.Core.SendEmail({
      to: form.email,
      subject: `Thank You! Your Event Request Has Been Received - Pilates in Pink Studio`,
      body: emailBody,
      from_name: 'Pilates in Pink™ Studio',
    });

    // Notify studio owner
    await base44.integrations.Core.SendEmail({
      to: 'info@pilatesinpinkstudio.com',
      subject: `New Event Request: ${form.event_type} - ${form.full_name}`,
      body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#ec4899;">New Event Request Received</h2>
        <p><strong>Name:</strong> ${form.full_name}</p>
        <p><strong>Email:</strong> ${form.email}</p>
        <p><strong>Phone:</strong> ${form.phone}</p>
        <p><strong>Event Type:</strong> ${form.event_type}</p>
        <p><strong>Date:</strong> ${form.event_date}</p>
        <p><strong>Guests:</strong> ${form.number_of_guests}</p>
        <p><strong>Duration:</strong> ${form.duration}</p>
        <p><strong>Time Slot:</strong> ${form.time_slot}</p>
        <p><strong>Classes:</strong> ${form.selected_classes.join(', ') || 'None'}</p>
        <p><strong>Add-Ons:</strong> ${form.add_ons.join(', ') || 'None'}</p>
        <p><strong>Notes:</strong> ${form.notes || 'None'}</p>
        <p><strong>Budget:</strong> ${form.budget || 'Not specified'}</p>
        <br/><p><a href="${window.location.origin}/Dashboard" style="background:#ec4899;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">View in Dashboard →</a></p>
      </div>`,
      from_name: 'Pilates in Pink Events System',
    });

    setSubmitting(false);
    navigate('/Confirmation', { state: { name: form.full_name, email: form.email, eventType: form.event_type } });
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: '#fbe0e2'}}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{color: '#b67651'}}>Submit Event Request</h1>
          <p className="mt-2 text-sm" style={{color: '#f1889b'}}>Fill out the details below and we'll get back to you within 24 hours</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Contact Info */}
          <section className="bg-white border rounded-2xl p-6 shadow-sm" style={{borderColor: '#f7b1bd'}}>
            <h2 className="text-base font-semibold mb-4" style={{color: '#b67651'}}>Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Full Name *</label>
                <input required value={form.full_name} onChange={e => set('full_name', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300" placeholder="Your full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Email *</label>
                  <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Phone Number</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300" placeholder="Your phone number" />
                </div>
              </div>
            </div>
          </section>

          {/* Event Details */}
          <section className="bg-white border rounded-2xl p-6 shadow-sm" style={{borderColor: '#f7b1bd'}}>
            <h2 className="text-base font-semibold mb-4" style={{color: '#b67651'}}>Event Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Event Type *</label>
                <select required value={form.event_type} onChange={e => set('event_type', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300 bg-white">
                  <option value="">Select event type</option>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_ICONS[t]} {t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Preferred Date *</label>
                  <input required type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Number of Guests</label>
                  <input type="number" min="1" value={form.number_of_guests} onChange={e => set('number_of_guests', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300" placeholder="e.g. 8" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Preferred Time(s)</label>
                <input value={form.preferred_times} onChange={e => set('preferred_times', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300" placeholder="e.g. 1:30pm - 3:30pm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Time Slot</label>
                <select value={form.time_slot} onChange={e => { set('time_slot', e.target.value); set('duration', ''); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300 bg-white">
                  <option value="">Select time slot</option>
                  <option value="Peak Hours (Fri-Sun, 10AM-6PM)">Peak Hours (Fri-Sun, 10AM-6PM)</option>
                  <option value="Non-Peak Hours (Mon-Thu, 12:30-3:30PM)">Non-Peak Hours (Mon-Thu, 12:30-3:30PM)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Duration</label>
                <select value={form.duration} onChange={e => set('duration', e.target.value)}
                  disabled={!form.time_slot}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="">{form.time_slot ? 'Select duration' : 'Select a time slot first'}</option>
                  {durationOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {form.time_slot && form.time_slot !== 'Peak Hours (Fri-Sun, 10AM-6PM)' && (
                  <p className="text-xs text-gray-400 mt-1">4-hour option only available for Peak Hours (Fri-Sun)</p>
                )}
              </div>
            </div>
          </section>

          {/* Classes */}
          <section className="bg-white border rounded-2xl p-6 shadow-sm" style={{borderColor: '#f7b1bd'}}>
            <h2 className="text-base font-semibold mb-4" style={{color: '#b67651'}}>Select Classes</h2>
            <div className="space-y-2">
              {CLASS_OPTIONS.map(c => (
                <label key={c} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-pink-200 cursor-pointer transition-colors">
                  <input type="checkbox" checked={form.selected_classes.includes(c)} onChange={() => toggleArray('selected_classes', c)}
                    className="accent-pink-400 w-4 h-4" />
                  <span className="text-sm text-gray-700">{c}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Add-Ons */}
          <section className="bg-white border rounded-2xl p-6 shadow-sm" style={{borderColor: '#f7b1bd'}}>
            <h2 className="text-base font-semibold mb-4" style={{color: '#b67651'}}>Add-Ons</h2>
            <div className="space-y-2">
              {ADDON_OPTIONS.map(a => (
                <label key={a} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-pink-200 cursor-pointer transition-colors">
                  <input type="checkbox" checked={form.add_ons.includes(a)} onChange={() => toggleArray('add_ons', a)}
                    className="accent-pink-400 w-4 h-4" />
                  <span className="text-sm text-gray-700">{a}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Budget & Notes */}
          <section className="bg-white border rounded-2xl p-6 shadow-sm" style={{borderColor: '#f7b1bd'}}>
            <h2 className="text-base font-semibold mb-4" style={{color: '#b67651'}}>Budget & Notes</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Budget Range</label>
                <input value={form.budget} onChange={e => set('budget', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300" placeholder="e.g. $500 - $800" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Additional Notes</label>
                <textarea rows={4} value={form.notes} onChange={e => set('notes', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300 resize-none" placeholder="Any special requests or questions..." />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full disabled:opacity-60 text-white py-3.5 rounded-2xl font-semibold text-base transition-colors shadow-md"
          style={{backgroundColor: '#f1889b'}}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}