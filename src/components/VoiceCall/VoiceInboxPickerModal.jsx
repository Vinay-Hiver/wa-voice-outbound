import React from 'react';
import { createPortal } from 'react-dom';
import { VOICE_INBOXES } from './data';
import './VoiceCall.css';

import dialogCloseIcon from '../../assets/icons/voice-call/dialog-close.svg';
import inboxPhoneIcon from '../../assets/icons/voice-call/inbox-phone.svg';
import hiverLogoSprite from '../../assets/icons/voice-call/hiver-logo-sprite.png';
import dialpadLogo from '../../assets/icons/voice-call/dialpad-logo.png';

function ProviderChip({ provider }) {
  return (
    <span className="voice-inbox-picker__chip">
      <span className="voice-inbox-picker__chip-logo">
        {provider === 'hiver' ? (
          // The Hiver mark is the left part of a wider logo sprite.
          <span className="voice-inbox-picker__hiver-logo">
            <img src={hiverLogoSprite} alt="" />
          </span>
        ) : (
          <img className="voice-inbox-picker__dialpad-logo" src={dialpadLogo} alt="" />
        )}
      </span>
      {provider === 'hiver' ? 'Hiver' : 'Dialpad'}
    </span>
  );
}

/** "Choose a Voice inbox to call from" (Figma 2378:6254). */
export default function VoiceInboxPickerModal({ open, onClose, onSelect }) {
  React.useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="voice-inbox-picker__overlay" onClick={onClose}>
      <div
        className="voice-inbox-picker"
        role="dialog"
        aria-label="Choose a Voice inbox to call from"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="voice-inbox-picker__header">
          <h2>Choose a Voice inbox to call from</h2>
          <button type="button" className="voice-inbox-picker__close" title="Close" onClick={onClose}>
            <img src={dialogCloseIcon} alt="" width="16" height="16" />
          </button>
        </div>
        <div className="voice-inbox-picker__body">
          {VOICE_INBOXES.map((inbox) => (
            <button
              key={inbox.id}
              type="button"
              className="voice-inbox-picker__row"
              onClick={() => onSelect?.(inbox)}
            >
              <span className="voice-inbox-picker__row-icon">
                <img src={inboxPhoneIcon} alt="" width="14" height="14" />
              </span>
              <span className="voice-inbox-picker__row-label">
                <span className="voice-inbox-picker__row-name">{inbox.name}</span>
                <span className="voice-inbox-picker__row-number">{inbox.number}</span>
              </span>
              <ProviderChip provider={inbox.provider} />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
