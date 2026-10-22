import { useSyncExternalStore } from 'react';

// Outbound calls per voice inbox. They all live in the inbox's Mine view
// (the agent who places a call owns it). Status: 'ringing' → 'active' → 'ended'.
const CALLS_BY_INBOX = {};
let version = 0;
const listeners = new Set();

const notify = () => {
  version += 1;
  listeners.forEach((l) => l());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Re-renders the caller whenever a call is added or changes state.
export const useVoiceCallsVersion = () => useSyncExternalStore(subscribe, () => version);

export const getVoiceCalls = (inbox) => CALLS_BY_INBOX[inbox] || [];

const findCall = (id) =>
  Object.values(CALLS_BY_INBOX).flat().find((c) => c.id === id);

const update = (id, changes) => {
  const call = findCall(id);
  if (!call) return;
  Object.assign(call, changes);
  notify();
};

export const startOutgoingCall = (inbox, { name, number }) => {
  const now = new Date();
  const call = {
    id: `call-${now.getTime()}`,
    inbox,
    name: name || '',
    number,
    status: 'ringing',
    startedAt: now,
    connectedAt: null,
    transcriptReady: false,
  };
  CALLS_BY_INBOX[inbox] = [call, ...getVoiceCalls(inbox)];
  notify();
  return call.id;
};

export const connectCall = (id) => update(id, { status: 'active', connectedAt: new Date() });

// Like voice-channel: the transcript + AI summary are "ready" 6s after a
// connected call ends. A call cancelled before connecting has no recording.
export const endCall = (id) => {
  const call = findCall(id);
  if (!call || call.status === 'ended') return;
  const wasConnected = call.status === 'active';
  update(id, { status: 'ended', answered: wasConnected });
  if (wasConnected) setTimeout(() => update(id, { transcriptReady: true }), 6000);
};

export const getCallStatus = (id) => findCall(id)?.status;
