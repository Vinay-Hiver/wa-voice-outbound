import React from 'react';
import './VoiceInboxView.css';
import RightPanel from '../RightPanel';
import SkeletonText from './SkeletonText';
import VoicePlayer from './VoicePlayer';
import { getVoiceCalls, endCall, useVoiceCallsVersion } from '../../data/voiceCalls';
import { CURRENT_USER } from '../../data/currentUser';

// Icons (from VinaySC/voice-channel)
import sideBarIcon from '../../assets/icons/side-bar-icon.svg';
import incomingCallDg14 from '../../assets/icons/voice-inbox/incoming-call-dg-14.svg';
import incomingCall14 from '../../assets/icons/voice-inbox/incoming-call-14.svg';
import incomingCallDg10 from '../../assets/icons/voice-inbox/incoming-call-dg-10.svg';
import incomingCall16 from '../../assets/icons/voice-inbox/incoming-call-16.svg';
import genericAvatar from '../../assets/icons/call-strip/generic-avatar.svg';
import microphoneIcon from '../../assets/icons/call-strip/microphone.svg';
import pauseIcon from '../../assets/icons/call-strip/pause.svg';
import endCallIcon from '../../assets/icons/call-strip/end-call.svg';
import aiSummaryIcon from '../../assets/icons/voice-inbox/ai-summary.svg';
import transcriptIcon from '../../assets/icons/voice-inbox/transcript.svg';
import sChevronDown from '../../assets/icons/s-chevron-down.svg';
import sampleAudio from '../../assets/audio/sample-audio.mp3';
import conversationEmptyState from '../../assets/icons/voice-inbox/conversation-empty-state.png';

const transcriptData = [
  { time: "00:00", name: "Chris Nash", text: "Hey everybody, my name is Chris Nash.", isAgent: true },
  { time: "00:02", name: "Jakob Bergson", text: "It's a new year, which means it's time for a new podcast.", isAgent: false },
  { time: "00:05", name: "Chris Nash", text: "Now unlike all of your other favorite podcasts, this one will only take one minute of your time, every time, all the time.", isAgent: true },
  { time: "00:13", name: "Jakob Bergson", text: "Sometimes it'll be just me.", isAgent: false },
  { time: "00:15", name: "Chris Nash", text: "Other times it'll be just you, seriously, submit stuff, your opinions, videos, I want to know what you have to say, I want to share what you have to say.", isAgent: true },
  { time: "00:25", name: "Jakob Bergson", text: "Other times I'll be joined by excellent guests, like Cameron Hart of the Turnamental podcast.", isAgent: false },
  { time: "00:30", name: "Chris Nash", text: "\"Hey Nash, that one minute podcast idea, don't do it. It's a terrible idea.\"", isAgent: true },
  { time: "00:34", name: "Jakob Bergson", text: "Swell.", isAgent: false },
  { time: "00:35", name: "Chris Nash", text: "Some episodes will be really funny. Other episodes will be really serious.", isAgent: true },
  { time: "00:40", name: "Jakob Bergson", text: "But I guarantee that every episode will be the best minute of your day.", isAgent: false },
  { time: "00:45", name: "Chris Nash", text: "Warning, depending on your preferences, one minute podcast may be the worst minute of your day.", isAgent: true },
];

const formatTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatCardDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const formatHeaderTime = (d) =>
  d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

// Seconds since `from`, ticking every second.
function useElapsed(from) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!from) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [from]);
  return from ? Math.max(0, Math.floor((now - from.getTime()) / 1000)) : 0;
}

/**
 * Voice inbox view, ported from VinaySC/voice-channel's ActiveCallView:
 * call list on the left, call detail (live call / recording + AI summary +
 * transcript) in the middle. Only Mine holds calls; other views are empty.
 */
export default function VoiceInboxView({ inbox, viewType = 'Mine' }) {
  useVoiceCallsVersion();
  const callList = viewType === 'Mine' ? getVoiceCalls(inbox) : [];
  const [selectedCallId, setSelectedCallId] = React.useState(null);
  const [isTranscriptOpen, setIsTranscriptOpen] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);

  // Newest call is selected when a new one is placed.
  const newestId = callList[0]?.id;
  React.useEffect(() => {
    if (newestId) setSelectedCallId(newestId);
  }, [newestId]);

  const activeCall = callList.find((c) => c.id === selectedCallId) || callList[0];
  const shouldShowEmptyState = callList.length === 0;
  const connectedSeconds = useElapsed(activeCall?.status === 'active' ? activeCall.connectedAt : null);
  const ringingSeconds = useElapsed(activeCall?.status === 'ringing' ? activeCall.startedAt : null);

  const displayEnded = activeCall?.status === 'ended';
  const calleeLabel = activeCall?.name || activeCall?.number;

  return (
    <div className="voice-inbox-view">
      {/* 1. Left Panel (Call List) */}
      <div className="call-list-panel">
        <div className="subject-bar">
          <div className="subject-left">
            <button className="icon-btn">
              <img src={sideBarIcon} alt="Sidebar" width="16" height="16" />
            </button>
            <div className="subject-title-wrapper">
              <div className="vertical-divider"></div>
              <h2 className="subject-title">{viewType}</h2>
            </div>
          </div>
        </div>
        <div className="call-cards-container">
          {shouldShowEmptyState ? (
            <div className="empty-state-container">
              <p className="empty-state-text">There are no conversations here<br />right now</p>
            </div>
          ) : (
            callList.map((call) => (
              <div
                key={call.id}
                className={`voice-call-card ${activeCall?.id === call.id ? 'active' : ''}`}
                onClick={() => setSelectedCallId(call.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-top">
                  <div className="caller-basic">
                    <img
                      src={call.status === 'ended' ? incomingCall14 : incomingCallDg14}
                      alt=""
                      width="14"
                      height="14"
                    />
                    <span className="caller-name">{call.name || call.number}</span>
                  </div>
                  <span className="card-date">{formatCardDate(call.startedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {shouldShowEmptyState ? (
        <div className="main-empty-state-view">
          <div className="empty-state-content">
            <img src={conversationEmptyState} alt="No conversations" className="empty-state-img-large" />
            <h2 className="empty-state-title-large">No conversations yet</h2>
            <p className="empty-state-subtitle-large">
              Conversations will appear here automatically when you start receiving calls
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Middle Panel (Call Detail) */}
          <div className="call-detail-panel">
            <div className="detail-status-bar">
              <div className="status-left">
                <span className="status-title">Voice call with {calleeLabel}</span>
              </div>
              {displayEnded ? (
                <div className="status-pill-gray" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '1px 8px', backgroundColor: 'var(--slateSurfaceSlate150, #edf1f6)', borderRadius: '30px', height: '20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--slateTextBody, #334155)' }}>Ended</span>
                </div>
              ) : (
                <div className="status-pill-green">
                  <img src={incomingCallDg10} alt="" width="10" height="10" />
                  <span>Ongoing</span>
                </div>
              )}
            </div>

            <div className="detail-content-area">
              <div key={activeCall.id} className={`call-card-large ${isTranscriptOpen ? 'transcript-open' : ''}`}>
                <div className="card-header-info">
                  <div className="header-contact">
                    <div className="avatar-med">
                      <img src={genericAvatar} alt="Avatar" />
                    </div>
                    <div className="header-text">
                      <span className="contact-name">{activeCall.name || 'Unknown'}</span>
                      <span className="contact-number">{activeCall.number}</span>
                    </div>
                  </div>
                  <div className="header-time">{formatHeaderTime(activeCall.startedAt)}</div>
                </div>

                {!displayEnded ? (
                  <div className={`call-player-bar ${isExiting ? 'fade-out' : ''}`}>
                    <div className="player-left">
                      <img src={incomingCall16} alt="" width="16" height="16" />
                      <span>{activeCall.status === 'ringing' ? 'Calling…' : 'Connected'}</span>
                    </div>
                    <span className="player-timer">
                      {formatTime(activeCall.status === 'ringing' ? ringingSeconds : connectedSeconds)}
                    </span>
                    <div className="player-actions">
                      <div className="call-action-item">
                        <button className="player-action-btn">
                          <img src={microphoneIcon} alt="Mute" width="16" height="16" />
                        </button>
                        <span className="tooltip">Mute</span>
                      </div>
                      <div className="call-action-item">
                        <button className="player-action-btn">
                          <img src={pauseIcon} alt="Pause" width="16" height="16" />
                        </button>
                        <span className="tooltip">Pause</span>
                      </div>
                      <div className="call-action-item">
                        <button className="player-action-btn end-call-btn" onClick={() => {
                          setIsExiting(true);
                          setTimeout(() => {
                            setIsExiting(false);
                            endCall(activeCall.id);
                          }, 150);
                        }}>
                          <img src={endCallIcon} alt="End Call" width="16" height="16" />
                        </button>
                        <span className="tooltip">End Call</span>
                      </div>
                    </div>
                  </div>
                ) : !activeCall.answered ? (
                  // Cancelled before it connected — no recording or transcript.
                  <div className="ended-bottom-section fade-in">
                    <div className="ended-call-section">
                      <div className="ended-section-header align-start">
                        <div className="generating-text-wrapper">
                          <p className="generating-title">Call not connected</p>
                          <p className="generating-subtitle">The call was cancelled before {calleeLabel} answered.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ended-bottom-section fade-in">
                    <VoicePlayer src={sampleAudio} />

                    {!activeCall.transcriptReady ? (
                      <div className="ended-call-section">
                        <div className="ended-section-header align-start">
                          <div className="icon-generating-wrapper">
                            <img src={transcriptIcon} alt="" width="14" height="14" />
                          </div>
                          <div className="generating-text-wrapper">
                            <p className="generating-title">Generating transcript…</p>
                            <p className="generating-subtitle">AI summary will be available once it’s ready</p>
                          </div>
                        </div>
                        <div className="ended-section-content">
                          <SkeletonText lines={3} />
                        </div>
                      </div>
                    ) : (
                      <div className="fade-in final-reveal-wrapper">
                        <div className="ended-call-section">
                          <div className="ended-section-header">
                            <img src={aiSummaryIcon} alt="" width="14" height="14" />
                            <span className="ended-section-title">Summary</span>
                          </div>
                          <div className="ended-section-content">
                            <p className="summary-dummy-text">
                              The customer called to inquire about the delay in their order #12345.
                              I explained that the shipment was held up due to weather conditions at the hub.
                              They were understanding and requested an email update once the status changes to 'Out for delivery'.
                              I have set a follow-up task for tomorrow morning.
                            </p>
                          </div>
                        </div>

                        <div className="ended-divider"></div>

                        <div className="ended-call-section transcript-section">
                          <div className="ended-section-header clickable" onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}>
                            <div className="header-left">
                              <img src={transcriptIcon} alt="" width="14" height="14" />
                              <span className="ended-section-title">Transcript</span>
                            </div>
                            <img
                              src={sChevronDown}
                              alt=""
                              className={`chevron-icon ${isTranscriptOpen ? 'up' : ''}`}
                              width="16"
                              height="16"
                            />
                          </div>
                          {isTranscriptOpen && (
                            <div className="ended-section-content transcript-cards-list">
                              {transcriptData.map((item, index) => (
                                <div key={index} className={`transcript-card ${item.isAgent ? 'agent-card' : 'customer-card'}`}>
                                  <div className="card-header">
                                    <div className="card-header-left">
                                      <div className={`card-avatar ${item.isAgent ? 'agent-avatar' : 'avatar-small j-avatar'}`}>
                                        {item.isAgent ? 'C' : 'J'}
                                      </div>
                                      <span className="card-name">{item.name}</span>
                                    </div>
                                    <span className="card-time">{item.time}</span>
                                  </div>
                                  <div className="card-body">
                                    <p>{item.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Right Panel */}
          <RightPanel
            inboxName={`${inbox} Inbox`}
            channel="voice"
            assignee={CURRENT_USER.id}
            contact={{ name: activeCall.name || 'Unknown', phone: activeCall.number }}
          />
        </>
      )}
    </div>
  );
}
