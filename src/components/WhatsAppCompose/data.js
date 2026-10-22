import { CHANNEL_BY_INBOX, CHANNEL_CHATS } from '../../data/channelChats';

// Dummy data for the outbound WhatsApp composer.

// Contacts = everyone who already has a conversation in a WhatsApp inbox.
const WHATSAPP_INBOXES = Object.keys(CHANNEL_BY_INBOX).filter((i) => CHANNEL_BY_INBOX[i] === 'whatsapp');
const digits = (phone) => phone.replace(/\D/g, '');

export const WA_CONTACTS = WHATSAPP_INBOXES.flatMap((inbox) => CHANNEL_CHATS[inbox])
  .filter((c, i, all) => all.findIndex((o) => digits(o.phone) === digits(c.phone)) === i)
  .map((c) => ({ name: c.name, phone: c.phone, color: c.avatarColor }));

// WhatsApp numbers the agent can send from — one per WhatsApp inbox.
export const FROM_SENDERS = [
  { inbox: 'WhatsApp 01', number: '+18168157765' },
  { inbox: 'WhatsApp 02', number: '+16285550147' },
];

export const COUNTRIES = [
  { name: 'Afghanistan', dial: '+93', flag: '🇦🇫' },
  { name: 'Aland Islands', dial: '+358', flag: '🇦🇽' },
  { name: 'Albania', dial: '+355', flag: '🇦🇱' },
  { name: 'Algeria', dial: '+213', flag: '🇩🇿' },
  { name: 'AmericanSamoa', dial: '+1684', flag: '🇦🇸' },
  { name: 'Andorra', dial: '+376', flag: '🇦🇩' },
  { name: 'Argentina', dial: '+54', flag: '🇦🇷' },
  { name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { name: 'Austria', dial: '+43', flag: '🇦🇹' },
  { name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { name: 'Belgium', dial: '+32', flag: '🇧🇪' },
  { name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { name: 'China', dial: '+86', flag: '🇨🇳' },
  { name: 'Denmark', dial: '+45', flag: '🇩🇰' },
  { name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { name: 'France', dial: '+33', flag: '🇫🇷' },
  { name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { name: 'India', dial: '+91', flag: '🇮🇳' },
  { name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
  { name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { name: 'United States', dial: '+1', flag: '🇺🇸' },
];

export const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.name === 'United States');

// A number has an ongoing conversation in `inbox` when it has an open (not
// Closed) conversation there whose 24-hour window is still open. Those skip
// the template step and reply in that thread.
export const hasOngoingConversation = (number, inbox) =>
  (CHANNEL_CHATS[inbox] || []).some(
    (c) => digits(c.phone).endsWith(digits(number)) && digits(number).length >= 7
      && c.view !== 'Closed' && !c.blocked && !c.awaitingReply
  );
