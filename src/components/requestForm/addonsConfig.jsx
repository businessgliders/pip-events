// Shared add-on configuration used by the request form, dashboard modal, and emails.
//
// "included" items are bundled with every booking (pre-selected on the form).
// "Consent to Photos & Social Media" is included but NOT pre-selected — it must be
// an explicit opt-in by the client.
//
// "extra" items have a price and are organized into sections (Decor Options + Decor Add-ons).

export const INCLUDED_ADDONS = [
  { name: 'Sparkling & Still Water', desc: 'Refreshments for your group', preselect: true },
  { name: 'Cold Towels', desc: 'Refreshing cold towels for your guests', preselect: true },
];

export const CONSENT_ADDON = {
  name: 'Consent to Photos & Social Media',
  desc: 'Casual photos taken by our team — not professional photography',
};

export const EXTRA_ADDON_SECTIONS = [
  {
    title: 'Decor Options',
    exclusive: true,
    items: [
      {
        name: 'Decor Option 1 — Balloon Garland & Signage',
        desc: 'Balloon Garland (2 colours of your choice) · 1 Ripple board with "Happy birthday" / NAME signage · Black or Pink bow · 1 Plinth · Heart Balloons on each reformer',
        price: 'Quoted on confirmation',
        descOnHover: true,
      },
      {
        name: 'Decor Option 2 — Heart Balloon Display',
        desc: 'Heart Balloon Display · 1 Plinth · Custom Board Easel · Heart Balloon on each reformer',
        price: 'Quoted on confirmation',
        descOnHover: true,
      },
    ],
  },
  {
    title: 'Decor Add-ons',
    items: [
      { name: 'Extra Plinth', desc: 'Additional plinth for displays', price: '$20' },
      { name: 'Custom Board Easel', desc: 'Personalized custom board easel', price: '$60' },
      { name: 'Balloon on Each Reformer', desc: 'A balloon styled on every reformer', price: '$6 / balloon' },
      {
        name: '1 Ripple Board (TBD)',
        desc: 'Balloon Garland (2 colours of your choice) + "Happy birthday" / NAME of your choice signage',
        price: 'Quoted on confirmation',
      },
    ],
  },
];

// Flat list of all extra add-on names (used by modal / emails to look up pricing)
export const EXTRA_ADDONS = EXTRA_ADDON_SECTIONS.flatMap(s => s.items);

// All add-ons combined (used by emails for label + price lookup)
export const ALL_ADDONS = [...INCLUDED_ADDONS, CONSENT_ADDON, ...EXTRA_ADDONS];

// Default selections for new form
export const DEFAULT_PRESELECTED_ADDONS = INCLUDED_ADDONS
  .filter(a => a.preselect)
  .map(a => a.name);

// Helper for emails / modal: returns { name, price, included } or null
export function findAddon(name) {
  const included = INCLUDED_ADDONS.find(a => a.name === name);
  if (included) return { name: included.name, price: null, included: true };
  if (name === CONSENT_ADDON.name) return { name, price: null, included: true };
  const extra = EXTRA_ADDONS.find(a => a.name === name);
  if (extra) return { name: extra.name, price: extra.price, included: false };
  return { name, price: null, included: false }; // unknown / legacy
}