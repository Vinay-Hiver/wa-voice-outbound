// Dummy Views data per Shared Inbox.
// `views` holds every View in the inbox (system + custom), in catalogue order.
// `favouriteIds` is keyed by role — Admin and Agent each have their own
// personal favourites, kept entirely separate — with each value the ordered
// list of favourited View ids for that inbox (max 5 personal, separately
// capped from `teamFavouriteIds`).
// `sidebarOrder` (also keyed by role) is the single merged, drag-reorderable
// order of every id currently in favouriteIds[role] or teamFavouriteIds —
// personal and Team Favourites can be freely reordered against each other
// in this one list. The first 5 entries are what shows in the home nav.

// Standard set of system views shared by every inbox, with per-inbox counts.
const systemViews = (counts) => [
  { id: 'mine', name: 'Mine', type: 'system', icon: 'mine', count: counts.mine },
  { id: 'unassigned', name: 'Unassigned', type: 'system', icon: 'unassigned', count: counts.unassigned },
  { id: 'team', name: 'Team', type: 'system', icon: 'team', count: counts.team },
  { id: 'tickets', name: 'Tickets', type: 'system', icon: 'tickets', count: counts.tickets },
  { id: 'pending', name: 'Pending', type: 'system', icon: 'pending', count: counts.pending },
  { id: 'closed', name: 'Closed', type: 'system', icon: 'closed', count: counts.closed },
];

// Build an inbox in the standard format. `fav` is the personal-favourite id
// order (same for Admin & Agent by default); it drives the home-nav rows.
const makeInbox = (views, fav = ['mine'], channel = 'email') => ({
  channel,
  views,
  favouriteIds: { Admin: fav, Agent: fav },
  sidebarOrder: { Admin: fav, Agent: fav },
  teamFavouriteIds: [],
});

// Order shown in the sidebar: Chat, Slack, WhatsApp, then Email.
const ALL_VIEWS_BY_INBOX = {
  // ---- Chat inboxes ----
  'Chat 01': makeInbox([
    ...systemViews({ mine: 3, unassigned: 6, team: 8, tickets: 2, pending: 4, closed: 15 }),
    { id: 'custom-1', name: 'Sales Leads', type: 'custom', icon: 'layers', count: 5 },
    { id: 'custom-2', name: 'Follow-ups', type: 'custom', icon: 'layers', count: 3 },
  ], ['mine'], 'chat'),
  'Chat 02': makeInbox([
    ...systemViews({ mine: 2, unassigned: 4, team: 6, tickets: 1, pending: 3, closed: 9 }),
    { id: 'custom-1', name: 'Hot Deals', type: 'custom', icon: 'layers', count: 4 },
    { id: 'custom-2', name: 'Demos', type: 'custom', icon: 'layers', count: 2 },
  ], ['mine'], 'chat'),

  // ---- Slack inboxes ----
  'Slack 01': makeInbox([
    ...systemViews({ mine: 4, unassigned: 2, team: 10, tickets: 7, pending: 6, closed: 28 }),
    { id: 'custom-1', name: 'Incidents', type: 'custom', icon: 'layers', count: 2 },
    { id: 'custom-2', name: 'Deploys', type: 'custom', icon: 'layers', count: 5 },
  ], ['mine'], 'slack'),
  'Slack 02': makeInbox([
    ...systemViews({ mine: 1, unassigned: 3, team: 5, tickets: 2, pending: 4, closed: 12 }),
    { id: 'custom-1', name: 'Approvals', type: 'custom', icon: 'layers', count: 3 },
    { id: 'custom-2', name: 'Contracts', type: 'custom', icon: 'layers', count: 6 },
  ], ['mine'], 'slack'),

  // ---- WhatsApp inboxes ----
  'WhatsApp 01': makeInbox([
    ...systemViews({ mine: 5, unassigned: 8, team: 11, tickets: 3, pending: 7, closed: 34 }),
    { id: 'custom-1', name: 'Delayed', type: 'custom', icon: 'layers', count: 4 },
    { id: 'custom-2', name: 'Returns', type: 'custom', icon: 'layers', count: 2 },
  ], ['mine'], 'whatsapp'),
  'WhatsApp 02': makeInbox([
    ...systemViews({ mine: 3, unassigned: 5, team: 7, tickets: 2, pending: 5, closed: 20 }),
    { id: 'custom-1', name: 'Urgent', type: 'custom', icon: 'layers', count: 3 },
    { id: 'custom-2', name: 'VIP', type: 'custom', icon: 'layers', count: 1 },
  ], ['mine'], 'whatsapp'),

  // ---- Email inboxes ----
  'Email 01': {
    channel: 'email',
    views: [
      ...systemViews({ mine: 2, unassigned: 4, team: 12, tickets: 8, pending: 5, closed: 3 }),
      { id: 'custom-1', name: 'Escalated', type: 'custom', icon: 'layers', count: 3 },
      { id: 'custom-2', name: 'VIP', type: 'custom', icon: 'layers', count: 6 },
      { id: 'custom-3', name: 'High Priority', type: 'custom', icon: 'layers', count: 9 },
      { id: 'custom-4', name: 'SLA Breach', type: 'custom', icon: 'layers', count: 2 },
      { id: 'custom-5', name: 'New', type: 'custom', icon: 'layers', count: 11 },
      { id: 'custom-6', name: 'Bug Reports', type: 'custom', icon: 'layers', count: 4 },
      { id: 'custom-7', name: 'Features', type: 'custom', icon: 'layers', count: 7 },
      { id: 'custom-8', name: 'Enterprise', type: 'custom', icon: 'layers', count: 5 },
      { id: 'custom-9', name: 'Churn Risk', type: 'custom', icon: 'layers', count: 1 },
    ],
    favouriteIds: {
      Admin: ['mine', 'unassigned', 'pending', 'closed'],
      Agent: ['mine', 'unassigned', 'closed'],
    },
    sidebarOrder: {
      Admin: ['mine', 'unassigned', 'pending', 'closed'],
      Agent: ['mine', 'unassigned', 'closed'],
    },
    teamFavouriteIds: [],
  },
  'Email 02': makeInbox([
    ...systemViews({ mine: 5, unassigned: 3, team: 9, tickets: 4, pending: 11, closed: 40 }),
    { id: 'custom-1', name: 'Invoices Overdue', type: 'custom', icon: 'layers', count: 7 },
    { id: 'custom-2', name: 'Refunds', type: 'custom', icon: 'layers', count: 4 },
    { id: 'custom-3', name: 'Disputes', type: 'custom', icon: 'layers', count: 2 },
    { id: 'custom-4', name: 'High Value', type: 'custom', icon: 'layers', count: 6 },
    { id: 'custom-5', name: 'Chargebacks', type: 'custom', icon: 'layers', count: 1 },
  ], ['mine'], 'email'),
};

// This prototype only shows the WhatsApp inboxes.
const PROTOTYPE_INBOXES = ['WhatsApp 01', 'WhatsApp 02'];
export const INITIAL_VIEWS_BY_INBOX = Object.fromEntries(
  PROTOTYPE_INBOXES.map((name) => [name, ALL_VIEWS_BY_INBOX[name]])
);

export const MAX_FAVOURITES = 5;
