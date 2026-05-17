import { Check, Gift, Plus, Camera } from 'lucide-react';
import { INCLUDED_ADDONS, EXTRA_ADDON_SECTIONS, CONSENT_ADDON } from './addonsConfig';

function AddonCheckbox({ item, checked, onToggle, highlight, price }) {
  return (
    <label
      className="flex items-start gap-3.5 p-4 rounded-xl cursor-pointer transition-all"
      style={{
        border: checked
          ? '1.5px solid #f1889b'
          : highlight
          ? '1.5px solid #e86c84'
          : '1.5px solid rgba(220,200,205,0.4)',
        background: checked
          ? 'rgba(241,136,155,0.08)'
          : highlight
          ? 'rgba(241,136,155,0.04)'
          : 'rgba(255,255,255,0.4)',
        boxShadow: highlight && !checked ? '0 0 0 3px rgba(241,136,155,0.12)' : 'none',
      }}
    >
      <div
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
        style={{
          background: checked ? '#f1889b' : 'white',
          border: checked ? 'none' : '1.5px solid #d4b8bb',
        }}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold" style={{ color: checked ? '#f1889b' : '#6b4e4e' }}>
            {item.name}
          </p>
          {price && (
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
              style={{ background: 'rgba(182,118,81,0.12)', color: '#b67651', marginRight: '4px' }}
            >
              {price}
            </span>
          )}
          {highlight && !checked && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(241,136,155,0.15)', color: '#e86c84' }}
            >
              Opt-in
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#a07878' }}>
          {item.desc}
        </p>
      </div>
    </label>
  );
}

export default function AddonsStep({ selected, onToggle }) {
  // Exclusive section: selecting one item deselects others in the same section
  const handleExclusiveToggle = (section, itemName) => {
    const isChecked = selected.includes(itemName);
    if (isChecked) {
      onToggle(itemName);
    } else {
      // Deselect all other items in this section first, then select the new one
      section.items.forEach(other => {
        if (other.name !== itemName && selected.includes(other.name)) {
          onToggle(other.name);
        }
      });
      onToggle(itemName);
    }
  };

  return (
    <div className="space-y-6">
      {/* INCLUDED */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4" style={{ color: '#16a34a' }} />
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#16a34a' }}>
            Included with every booking
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {INCLUDED_ADDONS.map(item => (
            <AddonCheckbox
              key={item.name}
              item={item}
              checked={selected.includes(item.name)}
              onToggle={() => onToggle(item.name)}
            />
          ))}
        </div>
      </div>

      {/* CONSENT — standalone opt-in */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Camera className="w-4 h-4" style={{ color: '#e86c84' }} />
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#e86c84' }}>
            Photo & Social Media Consent
          </h3>
        </div>
        <AddonCheckbox
          item={CONSENT_ADDON}
          checked={selected.includes(CONSENT_ADDON.name)}
          highlight
          onToggle={() => onToggle(CONSENT_ADDON.name)}
        />
        <p className="text-xs italic mt-2" style={{ color: '#a07878' }}>
          Casual photos only — we do not provide professional photography.
        </p>
      </div>

      {/* EXTRA SECTIONS */}
      {EXTRA_ADDON_SECTIONS.map(section => (
        <div key={section.title}>
          <div className="flex items-center gap-2 mb-1">
            <Plus className="w-4 h-4" style={{ color: '#b67651' }} />
            <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#b67651' }}>
              {section.title}{' '}
              <span className="font-normal text-xs normal-case" style={{ color: '#a07878' }}>
                {section.exclusive ? '(choose one — additional cost)' : '(additional cost)'}
              </span>
            </h3>
          </div>
          {section.subtitle && (
            <p className="text-xs mb-3 ml-6" style={{ color: '#a07878' }}>
              {section.subtitle}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {section.items.map(item => (
              <AddonCheckbox
                key={item.name}
                item={item}
                checked={selected.includes(item.name)}
                price={item.price}
                onToggle={() =>
                  section.exclusive
                    ? handleExclusiveToggle(section, item.name)
                    : onToggle(item.name)
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}