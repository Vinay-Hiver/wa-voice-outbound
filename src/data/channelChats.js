import { useSyncExternalStore } from 'react';
import { CURRENT_USER } from './currentUser';

// Dummy chat conversations per channel Shared Inbox, grouped by view
// (Unassigned / Assigned to Bot / Mine / All Assigned / Closed). Each view has
// a few conversations; the sidebar shows the per-view count and the inbox total.

// This prototype only shows the WhatsApp inboxes.
export const CHANNEL_BY_INBOX = {
  'WhatsApp 01': 'whatsapp',
  'WhatsApp 02': 'whatsapp',
};

// Slack #channel chip per inbox.
const SLACK_CHANNEL = {
  'Slack 01': 'support',
  'Slack 02': 'shipping',
};

const NAMES = [
  'Priya Nair', 'Marcus Lee', 'Sofia Reyes', 'Daniel Kim', 'Grace Okafor',
  'Tom Becker', 'Hana Sato', 'Liam Walsh', 'Ava Patel', 'Noah Khan',
  'Arlene McCoy', 'Guy Hawkins', 'Courtney Henry', 'Darlene Robertson', 'Eleanor Pena',
  'Floyd Miles', 'Jerome Bell', 'Devon Lane', 'Kathryn Murphy', 'Jacob Jones',
  'Kristin Watson', 'Cody Fisher', 'Jane Cooper', 'Wade Warren', 'Esther Howard',
  'Leslie Alexander', 'Jenny Wilson', 'Robert Fox', 'Albert Flores', 'Bessie Cooper',
  'Ralph Edwards', 'Cameron Williamson', 'Brooklyn Simmons', 'Theresa Webb', 'Marvin McKinney',
  'Savannah Nguyen', 'Annette Black', 'Ronald Richards', 'Dianne Russell', 'Ralph Johnson',
];
const COLORS = ['#7b8bd4', '#d96d71', '#caaed1', '#98d2c5', '#e0b83a', '#8b7fd4', '#f19192'];
const PREVIEWS = [
  'Is the pro plan available monthly?',
  'The chat widget is not loading on mobile',
  'Can we get a demo for our team next week?',
  'Interested in upgrading to the enterprise tier',
  'Need help with account setup',
  'My order has been delayed, can you check?',
  'Following up on my previous ticket',
  'Thanks for the quick help earlier!',
  'How do I reset my password?',
  'Please rate the chat',
];
const DATES = ['Jul 23', 'Jul 22', 'Jul 21', 'Jul 20', 'Jul 19'];
const AREA_CODES = ['415', '212', '312', '617', '206', '512', '303', '404', '702', '619'];

const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');

let globalNameIdx = 0;

const makeConvos = (inbox, channel, view, count) =>
  Array.from({ length: count }, (_, i) => {
    const idx = globalNameIdx++;
    const name = NAMES[idx % NAMES.length];
    const preview = PREVIEWS[idx % PREVIEWS.length];
    const color = COLORS[idx % COLORS.length];
    const date = DATES[idx % DATES.length];
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const phone = `+1 ${AREA_CODES[idx % AREA_CODES.length]}-555-01${(10 + (idx % 90)).toString().padStart(2, '0')}`;
    return {
      id: `${slug(inbox)}-${slug(view)}-${i}`,
      view,
      name,
      email,
      phone,
      title: name,
      avatarInitial: name.charAt(0),
      avatarColor: color,
      channel: SLACK_CHANNEL[inbox] || 'support',
      date,
      preview,
      messages: [
        { kind: 'incoming', text: preview, time: `${date}, 10:0${i + 1} AM` },
        { kind: 'agent-text', text: 'Sure, happy to help with that!', time: `${date}, 10:0${i + 2} AM`, sender: 'Arnold' },
      ],
    };
  });

const buildInbox = (inbox, channel) => {
  const views = channel === 'chat'
    ? [['Unassigned', 3], ['Assigned to Bot', 2], ['Mine', 3], ['All Assigned', 2], ['Closed', 2]]
    : [['Unassigned', 3], ['Mine', 3], ['All Assigned', 2], ['Closed', 2]];
  let out = [];
  views.forEach(([view, count]) => {
    out = out.concat(makeConvos(inbox, channel, view, count));
  });
  return out;
};

export const CHANNEL_CHATS = Object.fromEntries(
  Object.entries(CHANNEL_BY_INBOX).map(([inbox, channel]) => [inbox, buildInbox(inbox, channel)])
);

// Keep the WhatsApp 24-hour template demo on one conversation.
if (CHANNEL_CHATS['WhatsApp 01']?.[0]) CHANNEL_CHATS['WhatsApp 01'][0].blocked = true;

// Views that carry a conversation count in the sidebar.
const COUNTED_VIEWS = new Set(['Unassigned', 'Assigned to Bot', 'Mine', 'All Assigned', 'Pending', 'Closed']);
export const isCountedView = (view) => COUNTED_VIEWS.has(view);
export const channelViewCount = (inbox, view) =>
  (CHANNEL_CHATS[inbox] || []).filter((c) => c.view === view).length;
export const channelInboxTotal = (inbox) => (CHANNEL_CHATS[inbox] || []).length;

// ---- Outbound messages -------------------------------------------------
// Messages sent from the "New WhatsApp message" composer land in that inbox's
// Pending view. CHANNEL_CHATS is mutated in place and subscribers re-render.
let chatsVersion = 0;
const listeners = new Set();

export const subscribeChannelChats = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getChannelChatsVersion = () => chatsVersion;
// Re-renders the caller whenever an outbound message is added.
export const useChannelChatsVersion = () =>
  useSyncExternalStore(subscribeChannelChats, getChannelChatsVersion);

const NOW = () =>
  new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/**
 * Add an outbound message to `inbox`'s Pending view. Re-uses the Pending
 * conversation for the same number if there is one, and moves it to the top.
 * `message` is a ChatPanel message ({ kind: 'agent-text', text } or
 * { kind: 'template', template, values }). Returns the conversation id.
 */
export const addPendingMessage = (inbox, { name, phone, color }, message) => {
  const list = CHANNEL_CHATS[inbox];
  if (!list) return null;
  const digits = phone.replace(/\D/g, '');
  const msg = { id: `out-${Date.now()}`, time: NOW(), status: 'sent', sender: CURRENT_USER.name, ...message };
  const preview = message.kind === 'template' ? `Template: ${message.template?.name || 'WhatsApp template'}` : message.text;

  let convo = list.find((c) => c.view === 'Pending' && c.phone.replace(/\D/g, '') === digits);
  if (convo) {
    list.splice(list.indexOf(convo), 1);
    convo.messages = [...convo.messages, msg];
    convo.preview = preview;
    convo.date = 'Now';
    if (message.kind === 'template') convo.awaitingReply = true;
  } else {
    const title = name || phone;
    convo = {
      id: `${slug(inbox)}-pending-${Date.now()}`,
      view: 'Pending',
      name: title,
      email: '',
      phone,
      title,
      avatarInitial: name ? name.charAt(0) : '#',
      avatarColor: color || COLORS[0],
      channel: 'support',
      date: 'Now',
      preview,
      // After an outbound template the agent can't message again until the customer replies.
      awaitingReply: message.kind === 'template',
      // The agent who starts an outbound conversation owns it.
      assignee: CURRENT_USER.id,
      messages: [msg],
    };
  }
  list.unshift(convo);
  chatsVersion += 1;
  listeners.forEach((l) => l());
  return convo.id;
};

/**
 * Append a free-form reply to the open (not Closed) conversation with `phone`
 * in `inbox`, moving it to the top of its view. It stays in that view — only
 * template sends go to Pending. Returns the view name, or null if none found.
 */
export const addReplyToConversation = (inbox, phone, text) => {
  const list = CHANNEL_CHATS[inbox];
  const digits = phone.replace(/\D/g, '');
  const convo = list?.find((c) => c.view !== 'Closed' && !c.awaitingReply && c.phone.replace(/\D/g, '') === digits);
  if (!convo) return null;
  list.splice(list.indexOf(convo), 1);
  convo.messages = [
    ...convo.messages,
    { id: `out-${Date.now()}`, kind: 'agent-text', text, time: NOW(), status: 'sent', sender: CURRENT_USER.name },
  ];
  convo.preview = text;
  convo.date = 'Now';
  list.unshift(convo);
  chatsVersion += 1;
  listeners.forEach((l) => l());
  return convo.view;
};

/**
 * Send a template inside an existing conversation (e.g. to restart an expired
 * 24-hour window). WhatsApp allows one template, so the conversation then
 * waits for the customer's reply before anything else can be sent.
 */
export const sendTemplateInConversation = (inbox, conversationId, template, values) => {
  const list = CHANNEL_CHATS[inbox];
  const convo = list?.find((c) => c.id === conversationId);
  if (!convo) return;
  list.splice(list.indexOf(convo), 1);
  convo.messages = [
    ...convo.messages,
    { id: `out-${Date.now()}`, kind: 'template', template, values, time: NOW(), status: 'sent', sender: CURRENT_USER.name },
  ];
  convo.preview = `Template: ${template?.name || 'WhatsApp template'}`;
  convo.date = 'Now';
  convo.awaitingReply = true;
  list.unshift(convo);
  chatsVersion += 1;
  listeners.forEach((l) => l());
};

// The conversation with `phone` in `inbox` that is waiting on a reply to a template, if any.
export const findAwaitingTemplateConversation = (inbox, phone) => {
  const digits = phone.replace(/\D/g, '');
  return (CHANNEL_CHATS[inbox] || []).find(
    (c) => c.awaitingReply && c.phone.replace(/\D/g, '') === digits
  );
};
