import React from 'react';
import { createPortal } from 'react-dom';
import './OutgoingCallStrip.css';

import callRejectIcon from '../../assets/icons/call-strip/call-reject.svg';
import genericAvatarIcon from '../../assets/icons/call-strip/generic-avatar.svg';
import microphoneIcon from '../../assets/icons/call-strip/microphone.svg';
import pauseIcon from '../../assets/icons/call-strip/pause.svg';
import endCallIcon from '../../assets/icons/call-strip/end-call.svg';
import phoneIncomingIcon from '../../assets/icons/call-strip/phone-incoming.svg';

// Lucide "phone" glyph; the voice-channel repo animates it with
// @animateicons — here a CSS ring keyframe does the same job.
const RingingPhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="call-icon-ringing">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const formatTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Bottom call strip, ported from VinaySC/voice-channel's IncomingCallStrip
 * (outgoing + connected states; sounds left out).
 */
export default function OutgoingCallStrip({ contactName, contactNumber, isAccepted = false, onEnd }) {
  const [seconds, setSeconds] = React.useState(1);
  const [connectedSeconds, setConnectedSeconds] = React.useState(0);
  const [isExiting, setIsExiting] = React.useState(false);

  // "Waiting for mm:ss" while ringing; call duration once connected.
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (isAccepted) setConnectedSeconds((s) => s + 1);
      else setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isAccepted]);

  const handleEnd = () => {
    setIsExiting(true);
    setTimeout(() => onEnd?.(), 150);
  };

  return createPortal(
    <div className={`incoming-call-strip-container ${isExiting ? 'exiting' : ''}`}>
      <div className="incoming-call-strip">
        <div className="profile-details">
          <div className="avatar-circle">
            <img src={genericAvatarIcon} alt="" width="28" height="28" />
          </div>
          <span className="profile-name">
            {`${contactName || 'Unknown'} ${contactNumber ? `(${contactNumber})` : ''}`}
          </span>
        </div>

        <div className="call-info-wrapper">
          {!isAccepted ? (
            <div key="outgoing-badge" className="call-info-badge call-strip-fade">
              <div className="call-icon-animated">
                <RingingPhoneIcon />
              </div>
              <span className="call-status">Outgoing call...</span>
              <span className="call-timer">Waiting for {formatTime(seconds)}</span>
            </div>
          ) : (
            <div key="connected-pill" className="connected-pill call-strip-fade">
              <img src={phoneIncomingIcon} alt="" width="16" height="16" />
              <span className="connected-status">Connected</span>
              <span className="connected-timer">{formatTime(connectedSeconds)}</span>
            </div>
          )}
        </div>

        <div className="call-actions">
          {!isAccepted ? (
            <div key="outgoing-actions" className="action-group call-strip-fade">
              <button className="btn-cancel" onClick={handleEnd}>
                <img src={callRejectIcon} alt="" width="14" height="14" />
                <span>Cancel</span>
              </button>
            </div>
          ) : (
            <div key="connected-actions" className="connected-actions call-strip-fade">
              <div className="call-action-item">
                <button className="icon-btn-action">
                  <img src={microphoneIcon} alt="" width="16" height="16" />
                </button>
                <span className="tooltip">Mute</span>
              </div>
              <div className="call-action-item">
                <button className="icon-btn-action">
                  <img src={pauseIcon} alt="" width="16" height="16" />
                </button>
                <span className="tooltip">Pause</span>
              </div>
              <div className="call-action-item">
                <button className="btn-end-call" onClick={handleEnd}>
                  <img src={endCallIcon} alt="" width="16" height="16" />
                </button>
                <span className="tooltip">End call</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
