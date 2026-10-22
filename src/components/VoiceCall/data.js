// Voice inboxes the agent can call from (Figma 2378:6254).
// `provider: 'hiver'` inboxes open the in-app dialer; Dialpad ones don't.
export const VOICE_INBOXES = [
  { id: 'hiver-voice-support', name: 'Hiver-Voice-Support', number: '+44 7911 123456', provider: 'hiver' },
  { id: 'it-support', name: 'IT-Support', number: '+1 415 555 2671', provider: 'hiver' },
  { id: 'dialpad-external', name: 'Dialpad-External', number: '+81 90 1234 5678', provider: 'dialpad' },
  { id: 'sales-support', name: 'Sales-Support', number: '+61 412 345 678', provider: 'dialpad' },
];

export const HIVER_VOICE_INBOXES = VOICE_INBOXES.filter((i) => i.provider === 'hiver');
