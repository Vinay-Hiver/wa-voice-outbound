import React from 'react';
import { createPortal } from 'react-dom';
import TemplateModal from '../TemplateModal/TemplateModal';
import TemplatePickerPopover from '../TemplateModal/TemplatePickerPopover';
import {
  WA_CONTACTS,
  COUNTRIES,
  DEFAULT_COUNTRY,
  FROM_SENDERS,
  hasOngoingConversation,
  hasExpiredWindow,
  findExpiredConversation,
} from './data';
import {
  addPendingMessage,
  addReplyToConversation,
  sendTemplateInConversation,
} from '../../data/channelChats';
import './WhatsAppComposeModal.css';

import headerWhatsappIcon from '../../assets/icons/wa-compose/header-whatsapp.svg';
import minimiseIcon from '../../assets/icons/wa-compose/minimise-glyph.svg';
import closeIcon from '../../assets/icons/wa-compose/close.svg';
import chevronDown14 from '../../assets/icons/wa-compose/chevron-down-14.svg';
import chevronDown16 from '../../assets/icons/wa-compose/chevron-down-16.svg';
import emptyWhatsappIcon from '../../assets/icons/wa-compose/empty-whatsapp.svg';
import templateEmptyIcon from '../../assets/icons/wa-compose/template-empty.svg';
import templateBtnIcon from '../../assets/icons/wa-compose/template-btn.svg';
import searchIcon from '../../assets/icons/wa-compose/search.svg';
import onlineDot from '../../assets/icons/wa-compose/online.svg';
import footerEmojiIcon from '../../assets/icons/wa-compose/footer-emoji.svg';
import footerAttachIcon from '../../assets/icons/wa-compose/footer-attach.svg';
import footerTemplateIcon from '../../assets/icons/wa-compose/footer-template.svg';

const senderLabel = (s) => `${s.number} (${s.inbox})`;

const formatPhone = ({ country, number }) => `${country.dial} ${number}`;

const isPhoneLike = (text) => /^[+\d][\d\s()-]*$/.test(text.trim());

// Splits a contact's "+1 403512098" into its country + local number.
const splitNumber = (phone) => {
  const [code, ...rest] = phone.split(' ');
  // Prefer the default (US) when several countries share a dial code like +1.
  const country = DEFAULT_COUNTRY.dial === code
    ? DEFAULT_COUNTRY
    : COUNTRIES.find((c) => c.dial === code) || DEFAULT_COUNTRY;
  return { country, number: rest.join(' ') };
};

/**
 * Bottom-right "New WhatsApp message" composer.
 * Flow: empty → pick contact / type number → (country picker) → start with a template.
 * A template goes to the From inbox's Pending view; a reply to an ongoing
 * conversation is added to that conversation. Then calls onSent(inbox, view).
 */
export default function WhatsAppComposeModal({ open, onClose, onSent, defaultInbox }) {
  const [minimised, setMinimised] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [toFocused, setToFocused] = React.useState(false);
  const [recipient, setRecipient] = React.useState(null); // { country, number }
  const [countryOpen, setCountryOpen] = React.useState(false);
  const [countrySearch, setCountrySearch] = React.useState('');
  const [templateOpen, setTemplateOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [slashPickerOpen, setSlashPickerOpen] = React.useState(false);
  const [fromInbox, setFromInbox] = React.useState(FROM_SENDERS[0].inbox);
  const [fromOpen, setFromOpen] = React.useState(false);

  const modalRef = React.useRef(null);
  const toInputRef = React.useRef(null);
  const phoneInputRef = React.useRef(null);

  // Reset whenever the composer is (re)opened.
  React.useEffect(() => {
    if (!open) return;
    setMinimised(false);
    setQuery('');
    setRecipient(null);
    setCountryOpen(false);
    setCountrySearch('');
    setTemplateOpen(false);
    setMessage('');
    setSlashPickerOpen(false);
    setFromOpen(false);
    // Send from the inbox the agent is in, when it's a WhatsApp inbox.
    setFromInbox(
      FROM_SENDERS.some((f) => f.inbox === defaultInbox) ? defaultInbox : FROM_SENDERS[0].inbox
    );
    requestAnimationFrame(() => toInputRef.current?.focus());
  }, [open]);

  // Close the From dropdown on outside click.
  React.useEffect(() => {
    if (!fromOpen) return undefined;
    const handle = (e) => {
      if (!e.target.closest('.wa-compose__from-menu, .wa-compose__from')) setFromOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [fromOpen]);

  // Close the country picker on outside click.
  React.useEffect(() => {
    if (!countryOpen) return undefined;
    const handle = (e) => {
      if (!e.target.closest('.wa-compose__country-picker, .wa-compose__country-btn')) {
        setCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [countryOpen]);

  // Close the "/" template picker on outside click (it lives inside the composer).
  React.useEffect(() => {
    if (!slashPickerOpen) return undefined;
    const handle = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) setSlashPickerOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [slashPickerOpen]);

  if (!open) return null;

  const trimmed = query.trim();
  const phoneQuery = trimmed && isPhoneLike(trimmed);
  const q = trimmed.toLowerCase();
  const filteredContacts = phoneQuery
    ? []
    : WA_CONTACTS.filter(
        (c) => !q || c.name.toLowerCase().includes(q) || c.phone.replace(/\s/g, '').includes(q)
      );
  const showSuggestions = toFocused && !recipient && (phoneQuery || filteredContacts.length > 0);

  const selectContact = (contact) => {
    setRecipient({ ...splitNumber(contact.phone), name: contact.name, color: contact.color });
    setQuery('');
    requestAnimationFrame(() => phoneInputRef.current?.focus());
  };

  const selectTypedNumber = () => {
    let number = trimmed;
    let country = DEFAULT_COUNTRY;
    const hasDialCode = number.startsWith('+');
    if (hasDialCode) {
      // Longest matching dial code wins (e.g. +1684 over +1).
      let match = [...COUNTRIES]
        .sort((a, b) => b.dial.length - a.dial.length)
        .find((c) => number.replace(/\s/g, '').startsWith(c.dial));
      if (match?.dial === DEFAULT_COUNTRY.dial) match = DEFAULT_COUNTRY;
      if (match) {
        country = match;
        number = number.replace(/\s/g, '').slice(match.dial.length);
      }
    }
    setRecipient({ country, number });
    setQuery('');
    if (hasDialCode) {
      requestAnimationFrame(() => phoneInputRef.current?.focus());
    } else {
      // No country code typed — ask for one right away.
      setCountrySearch('');
      setCountryOpen(true);
    }
  };

  const handleToKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    if (phoneQuery) selectTypedNumber();
    else if (filteredContacts.length === 1) selectContact(filteredContacts[0]);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (!value) {
      // Clearing the number returns to the free-text "To" field.
      setRecipient(null);
      setCountryOpen(false);
      requestAnimationFrame(() => toInputRef.current?.focus());
      return;
    }
    setRecipient((r) => ({ ...r, number: value, name: undefined }));
  };

  const clearRecipient = () => {
    setRecipient(null);
    setQuery('');
    setCountryOpen(false);
    setCountrySearch('');
    requestAnimationFrame(() => toInputRef.current?.focus());
  };

  // Same as the WhatsApp inbox composer: a leading "/" opens the template picker.
  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    if (value.startsWith('/') && !slashPickerOpen) setSlashPickerOpen(true);
  };

  const closeSlashPicker = () => {
    setSlashPickerOpen(false);
    setMessage((m) => (m.startsWith('/') ? '' : m));
  };

  const sendText = () => {
    const text = message.trim();
    if (!text) return;
    const view = addReplyToConversation(fromInbox, formatPhone(recipient), text);
    if (view) onSent?.(fromInbox, view);
  };

  const sendTemplate = (template, values) => {
    // Ongoing conversation with a closed 24-hour window: the template goes
    // into that same conversation instead of starting a new one in Pending.
    const expired = findExpiredConversation(recipient.number, fromInbox);
    if (expired) {
      sendTemplateInConversation(fromInbox, expired.id, template, values);
      onSent?.(fromInbox, expired.view);
      return;
    }
    addPendingMessage(
      fromInbox,
      { name: recipient.name, phone: formatPhone(recipient), color: recipient.color },
      { kind: 'template', template, values }
    );
    onSent?.(fromInbox, 'Pending');
  };

  const handleMessageKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !slashPickerOpen) {
      e.preventDefault();
      sendText();
    }
  };

  const pickCountry = (country) => {
    setRecipient((r) => ({ ...r, country }));
    setCountryOpen(false);
    setCountrySearch('');
    requestAnimationFrame(() => phoneInputRef.current?.focus());
  };

  const cs = countrySearch.trim().toLowerCase();
  const filteredCountries = COUNTRIES.filter(
    (c) => !cs || c.name.toLowerCase().includes(cs) || c.dial.includes(cs)
  );

  const ongoing = recipient && hasOngoingConversation(recipient.number, fromInbox);
  const windowExpired = recipient && !ongoing && hasExpiredWindow(recipient.number, fromInbox);

  let body;
  if (!recipient) {
    body = (
      <div className="wa-compose__empty">
        <div className="wa-compose__empty-icon">
          <img src={emptyWhatsappIcon} alt="" width="24" height="24" />
        </div>
        <div className="wa-compose__empty-text">
          <p className="wa-compose__empty-title">Start a new conversation</p>
          <p className="wa-compose__empty-subtitle">
            Choose a contact or enter
            <br />a phone number above
          </p>
        </div>
      </div>
    );
  } else if (ongoing) {
    body = (
      <div className="wa-compose__reply">
        <textarea
          className="wa-compose__reply-input"
          placeholder="Shift + Enter for new line. Type ‘/’ to search for WhatsApp templates and send quick replies"
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleMessageKeyDown}
        />
        <div className="wa-compose__reply-banner">Sent as a reply to an ongoing conversation</div>
        <div className="wa-compose__reply-footer">
          <div className="wa-compose__reply-tools">
            <button type="button" className="wa-compose__reply-tool" title="Emoji">
              <img src={footerEmojiIcon} alt="" width="16" height="16" />
            </button>
            <button type="button" className="wa-compose__reply-tool" title="Attach file">
              <img src={footerAttachIcon} alt="" width="16" height="16" />
            </button>
            <button
              type="button"
              className="wa-compose__reply-tool"
              title="WhatsApp templates"
              onClick={() => setTemplateOpen(true)}
            >
              <img src={footerTemplateIcon} alt="" width="16" height="16" />
            </button>
          </div>
          <button
            type="button"
            className="wa-compose__send-btn"
            disabled={!message.trim()}
            onClick={sendText}
          >
            Send
          </button>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="wa-compose__empty">
        <div className="wa-compose__empty-icon">
          <img src={templateEmptyIcon} alt="" width="24" height="24" />
        </div>
        <div className="wa-compose__empty-text">
          {windowExpired ? (
            <>
              <p className="wa-compose__empty-title">24-hour reply window has closed</p>
              <p className="wa-compose__empty-subtitle">
                Send a template to restart this conversation.
                <br />
                You can reply freely once the customer responds.
              </p>
            </>
          ) : (
            <>
              <p className="wa-compose__empty-title">Start with a template</p>
              <p className="wa-compose__empty-subtitle">
                Choose a template to start. You can reply
                <br />
                freely once the customer responds.
              </p>
            </>
          )}
        </div>
        <button type="button" className="wa-compose__template-btn" onClick={() => setTemplateOpen(true)}>
          <img src={templateBtnIcon} alt="" width="16" height="16" />
          Choose a template
        </button>
      </div>
    );
  }

  return createPortal(
    <>
      <div
        ref={modalRef}
        className={`wa-compose ${minimised ? 'wa-compose--minimised' : ''}`}
        role="dialog"
        aria-label="New WhatsApp message"
      >
        <div className="wa-compose__header" onClick={() => minimised && setMinimised(false)}>
          <div className="wa-compose__header-title">
            <span className="wa-compose__header-icon">
              <img src={headerWhatsappIcon} alt="" width="16" height="16" />
            </span>
            <p>New WhatsApp message</p>
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
                <button type="button" className="wa-compose__from" onClick={() => setFromOpen((o) => !o)}>
                  <p>{senderLabel(FROM_SENDERS.find((f) => f.inbox === fromInbox))}</p>
                  <img src={chevronDown14} alt="" width="14" height="14" />
                </button>
              </div>
            </div>

            <div className="wa-compose__row">
              <p className="wa-compose__label">To</p>
              <div className="wa-compose__to">
                {recipient?.name ? (
                  <span className="wa-compose__to-contact">
                    <span className="wa-compose__avatar" style={{ background: recipient.color }}>
                      {recipient.name[0]}
                    </span>
                    <span className="wa-compose__to-contact-name">{recipient.name}</span>
                    <span className="wa-compose__to-contact-number">({formatPhone(recipient)})</span>
                  </span>
                ) : recipient ? (
                  <>
                    <button
                      type="button"
                      className="wa-compose__country-btn"
                      title={recipient.country.name}
                      onClick={() => setCountryOpen((o) => !o)}
                    >
                      <span className="wa-compose__flag">{recipient.country.flag}</span>
                      <span className="wa-compose__dial">{recipient.country.dial}</span>
                      <img src={chevronDown16} alt="" width="16" height="16" />
                    </button>
                    <input
                      ref={phoneInputRef}
                      className="wa-compose__phone-input"
                      type="tel"
                      placeholder="Phone number"
                      value={recipient.number}
                      onChange={handlePhoneChange}
                    />
                  </>
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
                {(recipient || query) && (
                  <button
                    type="button"
                    className="wa-compose__to-clear"
                    title="Clear"
                    aria-label="Clear recipient"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={clearRecipient}
                  >
                    <img src={closeIcon} alt="" width="16" height="16" />
                  </button>
                )}
              </div>
            </div>

            <div className="wa-compose__body">{body}</div>

            {fromOpen && (
              <div className="wa-compose__dropdown wa-compose__from-menu">
                {FROM_SENDERS.map((f) => (
                  <button
                    key={f.inbox}
                    type="button"
                    className={`wa-compose__dropdown-item ${f.inbox === fromInbox ? 'selected' : ''}`}
                    onClick={() => {
                      setFromInbox(f.inbox);
                      setFromOpen(false);
                    }}
                  >
                    {senderLabel(f)}
                  </button>
                ))}
              </div>
            )}

            {showSuggestions && (
              // preventDefault on mousedown keeps focus in the To input while picking.
              <div className="wa-compose__dropdown" onMouseDown={(e) => e.preventDefault()}>
                {phoneQuery ? (
                  <button type="button" className="wa-compose__dropdown-item" onClick={selectTypedNumber}>
                    Send message to “{trimmed}”
                  </button>
                ) : (
                  filteredContacts.map((c) => (
                    <button
                      key={c.phone}
                      type="button"
                      className="wa-compose__dropdown-item"
                      onClick={() => selectContact(c)}
                    >
                      <span className="wa-compose__avatar" style={{ background: c.color }}>
                        {c.name[0]}
                        <img className="wa-compose__avatar-online" src={onlineDot} alt="" width="8" height="8" />
                      </span>
                      {c.name} ({c.phone})
                    </button>
                  ))
                )}
              </div>
            )}

            {countryOpen && (
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
                      className={`wa-compose__country-item ${c === recipient.country ? 'selected' : ''}`}
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
          </div>
        )}

        {slashPickerOpen && !minimised && (
          <div className="wa-compose__slash-anchor">
            <TemplatePickerPopover
              anchorLeft={0}
              anchorTop={0}
              onSend={sendTemplate}
              onDone={closeSlashPicker}
            />
          </div>
        )}
      </div>

      <TemplateModal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onSend={sendTemplate}
        recipient={
          recipient && {
            flag: recipient.country.flag,
            name: recipient.name,
            phone: formatPhone(recipient),
          }
        }
      />
    </>,
    document.body
  );
}
