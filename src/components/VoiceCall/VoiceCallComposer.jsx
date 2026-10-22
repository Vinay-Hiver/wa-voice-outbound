import React from 'react';
import { createPortal } from 'react-dom';
import { WA_CONTACTS, COUNTRIES, DEFAULT_COUNTRY } from '../WhatsAppCompose/data';
import { HIVER_VOICE_INBOXES } from './data';
// Shares the bottom-right composer shell with the WhatsApp composer.
import '../WhatsAppCompose/WhatsAppComposeModal.css';
import './VoiceCall.css';

import headerVoiceIcon from '../../assets/icons/voice-call/header-voice.svg';
import minimiseIcon from '../../assets/icons/wa-compose/minimise-glyph.svg';
import closeIcon from '../../assets/icons/voice-call/close.svg';
import chevronDown14 from '../../assets/icons/voice-call/chevron-down-14.svg';
import clearIcon from '../../assets/icons/voice-call/clear-14.svg';
import emptyCallIcon from '../../assets/icons/voice-call/empty-call.svg';
import rowCallIcon from '../../assets/icons/voice-call/row-call.svg';
import callBtnIcon from '../../assets/icons/voice-call/call-btn.svg';
import onlineDot from '../../assets/icons/voice-call/online.svg';
import chevronDown16 from '../../assets/icons/wa-compose/chevron-down-16.svg';
import searchIcon from '../../assets/icons/wa-compose/search.svg';

const isPhoneLike = (text) => /^[+\d][\d\s()-]*$/.test(text.trim());
const senderLabel = (inbox) => `${inbox.number} (${inbox.name})`;

// Typed numbers carry a country + local number; contacts carry a full phone.
const calleePhone = (callee) =>
  callee.typed ? `${callee.country.dial} ${callee.number}` : callee.phone;

/**
 * Bottom-right "New Voice call" composer for Hiver voice inboxes
 * (Figma 2380:19464): empty → pick contact / type number → Call.
 */
export default function VoiceCallComposer({ open, inbox, onClose, onCall }) {
  const [minimised, setMinimised] = React.useState(false);
  const [fromId, setFromId] = React.useState(inbox?.id);
  const [fromOpen, setFromOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [toFocused, setToFocused] = React.useState(false);
  const [callee, setCallee] = React.useState(null); // contact, or { typed, country, number }
  const [countryOpen, setCountryOpen] = React.useState(false);
  const [countrySearch, setCountrySearch] = React.useState('');
  const toInputRef = React.useRef(null);
  const phoneInputRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    setMinimised(false);
    setFromId(inbox?.id || HIVER_VOICE_INBOXES[0].id);
    setFromOpen(false);
    setQuery('');
    setCallee(null);
    setCountryOpen(false);
    setCountrySearch('');
    requestAnimationFrame(() => toInputRef.current?.focus());
  }, [open, inbox]);

  React.useEffect(() => {
    if (!countryOpen) return undefined;
    const handle = (e) => {
      if (!e.target.closest('.wa-compose__country-picker, .wa-compose__country-btn')) setCountryOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [countryOpen]);

  React.useEffect(() => {
    if (!fromOpen) return undefined;
    const handle = (e) => {
      if (!e.target.closest('.wa-compose__from-menu, .wa-compose__from')) setFromOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [fromOpen]);

  if (!open) return null;

  const fromInbox = HIVER_VOICE_INBOXES.find((i) => i.id === fromId) || HIVER_VOICE_INBOXES[0];
  const trimmed = query.trim();
  const phoneQuery = trimmed && isPhoneLike(trimmed);
  const q = trimmed.toLowerCase();
  const filteredContacts = phoneQuery
    ? []
    : WA_CONTACTS.filter((c) => !q || c.name.toLowerCase().includes(q));
  const showSuggestions = toFocused && !callee && (phoneQuery || filteredContacts.length > 0);

  const choose = (person) => {
    setCallee(person);
    setQuery('');
  };

  // Same as the WhatsApp composer: detect a typed +code, otherwise ask for the country.
  const chooseTypedNumber = () => {
    let number = trimmed;
    let country = DEFAULT_COUNTRY;
    const hasDialCode = number.startsWith('+');
    if (hasDialCode) {
      let match = [...COUNTRIES]
        .sort((a, b) => b.dial.length - a.dial.length)
        .find((c) => number.replace(/\s/g, '').startsWith(c.dial));
      if (match?.dial === DEFAULT_COUNTRY.dial) match = DEFAULT_COUNTRY;
      if (match) {
        country = match;
        number = number.replace(/\s/g, '').slice(match.dial.length);
      }
    }
    setCallee({ typed: true, country, number });
    setQuery('');
    if (hasDialCode) {
      requestAnimationFrame(() => phoneInputRef.current?.focus());
    } else {
      setCountrySearch('');
      setCountryOpen(true);
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (!value) {
      clearCallee();
      return;
    }
    setCallee((c) => ({ ...c, number: value }));
  };

  const pickCountry = (country) => {
    setCallee((c) => ({ ...c, country }));
    setCountryOpen(false);
    setCountrySearch('');
    requestAnimationFrame(() => phoneInputRef.current?.focus());
  };

  const cs = countrySearch.trim().toLowerCase();
  const filteredCountries = COUNTRIES.filter(
    (c) => !cs || c.name.toLowerCase().includes(cs) || c.dial.includes(cs)
  );

  const clearCallee = () => {
    setCallee(null);
    setQuery('');
    setCountryOpen(false);
    requestAnimationFrame(() => toInputRef.current?.focus());
  };

  const startCall = (person = callee) =>
    onCall?.(fromInbox, { ...person, phone: person.phone || calleePhone(person) });

  const handleToKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    if (phoneQuery) chooseTypedNumber();
    else if (filteredContacts.length === 1) choose(filteredContacts[0]);
  };

  return createPortal(
    <div
      className={`wa-compose ${minimised ? 'wa-compose--minimised' : ''}`}
      role="dialog"
      aria-label="New Voice call"
    >
      <div className="wa-compose__header" onClick={() => minimised && setMinimised(false)}>
        <div className="wa-compose__header-title">
          <span className="wa-compose__header-icon">
            <img src={headerVoiceIcon} alt="" width="16" height="16" />
          </span>
          <p>New Voice call</p>
        </div>
        <div className="wa-compose__header-actions">
          <button
            type="button"
            className="wa-compose__header-btn"
            title={minimised ? 'Expand' : 'Minimise'}
            onClick={(e) => {
              e.stopPropagation();
              setMinimised((m) => !m);
            }}
          >
            <span className="wa-compose__minimise-icon">
              <img src={minimiseIcon} alt="" />
            </span>
          </button>
          <button
            type="button"
            className="wa-compose__header-btn"
            title="Close"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
          >
            <img src={closeIcon} alt="" width="16" height="16" />
          </button>
        </div>
      </div>

      {!minimised && (
        <div className="wa-compose__content">
          <div className="wa-compose__row">
            <p className="wa-compose__label">From</p>
            <div className="wa-compose__from-wrap">
              <button
                type="button"
                className="wa-compose__from voice-call__from"
                onClick={() => setFromOpen((o) => !o)}
              >
                <p>{senderLabel(fromInbox)}</p>
                <img src={chevronDown14} alt="" width="14" height="14" />
              </button>
            </div>
          </div>

          <div className="wa-compose__row">
            <p className="wa-compose__label">To</p>
            <div className="wa-compose__to">
              {callee?.typed ? (
                <>
                  <button
                    type="button"
                    className="wa-compose__country-btn"
                    title={callee.country.name}
                    onClick={() => setCountryOpen((o) => !o)}
                  >
                    <span className="wa-compose__flag">{callee.country.flag}</span>
                    <span className="wa-compose__dial">{callee.country.dial}</span>
                    <img src={chevronDown16} alt="" width="16" height="16" />
                  </button>
                  <input
                    ref={phoneInputRef}
                    className="wa-compose__phone-input"
                    type="tel"
                    placeholder="Phone number"
                    value={callee.number}
                    onChange={handlePhoneChange}
                  />
                </>
              ) : callee ? (
                <span className="voice-call__to-value">{`${callee.name} (${callee.phone})`}</span>
              ) : (
                <input
                  ref={toInputRef}
                  className="wa-compose__to-input"
                  type="text"
                  placeholder="Name or phone number"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setToFocused(true)}
                  onBlur={() => setToFocused(false)}
                  onKeyDown={handleToKeyDown}
                />
              )}
              {(callee || query) && (
                <button
                  type="button"
                  className="wa-compose__to-clear"
                  title="Clear"
                  aria-label="Clear recipient"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={clearCallee}
                >
                  <img src={clearIcon} alt="" width="14" height="14" />
                </button>
              )}
            </div>
          </div>

          <div className="wa-compose__body">
            {callee ? (
              <div className="voice-call__callee">
                <div className="voice-call__callee-info">
                  {callee.name ? (
                    <span className="wa-compose__avatar" style={{ background: callee.color }}>
                      {callee.name[0]}
                      <img className="wa-compose__avatar-online" src={onlineDot} alt="" width="8" height="8" />
                    </span>
                  ) : (
                    // Unknown number — no avatar, so show the call glyph instead.
                    <div className="wa-compose__empty-icon voice-call__unknown-icon">
                      <img src={emptyCallIcon} alt="" width="24" height="24" />
                    </div>
                  )}
                  <p className="voice-call__callee-name">{callee.name || calleePhone(callee)}</p>
                  {callee.name && <p className="voice-call__callee-number">{callee.phone}</p>}
                </div>
                <button type="button" className="voice-call__call-btn" onClick={() => startCall()}>
                  <img src={callBtnIcon} alt="" width="14" height="14" />
                  Call
                </button>
              </div>
            ) : (
              <div className="wa-compose__empty">
                <div className="wa-compose__empty-icon">
                  <img src={emptyCallIcon} alt="" width="24" height="24" />
                </div>
                <div className="wa-compose__empty-text">
                  <p className="wa-compose__empty-title">Start a new call</p>
                  <p className="wa-compose__empty-subtitle">
                    Choose a contact or enter
                    <br />a phone number above
                  </p>
                </div>
              </div>
            )}
          </div>

          {countryOpen && callee?.typed && (
            <div className="wa-compose__country-picker">
              <div className="wa-compose__country-search">
                <img className="wa-compose__country-search-icon" src={searchIcon} alt="" width="16" height="16" />
                <input
                  type="text"
                  placeholder="Search country"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="wa-compose__country-list">
                {filteredCountries.map((c) => (
                  <button
                    key={`${c.name}${c.dial}`}
                    type="button"
                    className={`wa-compose__country-item ${c === callee.country ? 'selected' : ''}`}
                    onClick={() => pickCountry(c)}
                  >
                    <span className="wa-compose__flag">{c.flag}</span>
                    <span className="wa-compose__country-name">{c.name}</span>
                    <span className="wa-compose__country-dial">{c.dial}</span>
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <p className="wa-compose__country-empty">No countries found</p>
                )}
              </div>
            </div>
          )}

          {fromOpen && (
            <div className="wa-compose__dropdown wa-compose__from-menu">
              {HIVER_VOICE_INBOXES.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  className={`wa-compose__dropdown-item ${i.id === fromInbox.id ? 'selected' : ''}`}
                  onClick={() => {
                    setFromId(i.id);
                    setFromOpen(false);
                  }}
                >
                  {senderLabel(i)}
                </button>
              ))}
            </div>
          )}

          {showSuggestions && (
            <div className="wa-compose__dropdown voice-call__dropdown" onMouseDown={(e) => e.preventDefault()}>
              {phoneQuery ? (
                <button type="button" className="wa-compose__dropdown-item" onClick={chooseTypedNumber}>
                  Call “{trimmed}”
                </button>
              ) : (
                filteredContacts.map((c) => (
                  <div key={c.phone} className="voice-call__contact-row">
                    <button type="button" className="wa-compose__dropdown-item" onClick={() => choose(c)}>
                      <span className="wa-compose__avatar" style={{ background: c.color }}>
                        {c.name[0]}
                        <img className="wa-compose__avatar-online" src={onlineDot} alt="" width="8" height="8" />
                      </span>
                      {c.name} ({c.phone})
                    </button>
                    {/* Quick-call shortcut, shown on row hover */}
                    <button
                      type="button"
                      className="voice-call__row-call"
                      title={`Call ${c.name}`}
                      onClick={() => startCall(c)}
                    >
                      <img src={rowCallIcon} alt="" width="14" height="14" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}
