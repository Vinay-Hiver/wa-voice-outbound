import React from 'react';
import chevronDown14 from '../../assets/icons/wa-compose/chevron-down-14.svg';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primarySurfaceDefault)"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5 9-11" />
  </svg>
);

/**
 * "From" picker for the bottom-right composers: a pill that hugs its label,
 * with an options menu just below it (selected option bold + tick on the right),
 * matching the email composer's From dropdown.
 */
export default function FromSelect({ options, value, onChange, className = '' }) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const selected = options.find((o) => o.value === value) || options[0];

  React.useEffect(() => {
    if (!open) return undefined;
    const handle = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="wa-compose__from-wrap" ref={rootRef}>
      <button
        type="button"
        className={`wa-compose__from ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <p>{selected.label}</p>
        <img
          className={`wa-compose__from-chevron ${open ? 'open' : ''}`}
          src={chevronDown14}
          alt=""
          width="14"
          height="14"
        />
      </button>

      {open && (
        <div className="wa-compose__from-menu" role="listbox">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === selected.value}
              className={`wa-compose__from-option ${o.value === selected.value ? 'selected' : ''}`}
              onClick={() => {
                onChange?.(o.value);
                setOpen(false);
              }}
            >
              <span>{o.label}</span>
              {o.value === selected.value && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
