import { useState, useRef, useEffect } from 'react';
import {
  WhatsAppIcon,
  ChannelGlyph,
  SmileIcon,
  PaperclipIcon,
  SingleTickIcon,
  DoubleTickIcon,
  ReadTickIcon,
  WhatsAppTemplateIcon,
} from '../icons/Icon';
import whatsappTemplateUrl from '../../icons/whatsapp-template.svg';
import emojiIconUrl from '../../icons/emoji.svg';
import attachFileUrl from '../../icons/attach-file.svg';
import whatsappTemplatesUrl from '../../icons/whatsapp-templates.svg';
import TemplateModal from '../TemplateModal/TemplateModal';
import TemplatePickerPopover from '../TemplateModal/TemplatePickerPopover';
import TemplatePreviewCard from '../TemplateModal/TemplatePreview';
import { sendTemplateInConversation } from '../../data/channelChats';
import './ChatPanel.css';

// Must match .template-picker-popover's CSS height.
const TEMPLATE_PICKER_POPOVER_HEIGHT = 532;

function formatNow() {
  return new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function StatusTick({ status }) {
  if (status === 'sent') return <SingleTickIcon size={14} />;
  if (status === 'delivered') return <DoubleTickIcon size={14} />;
  return <ReadTickIcon size={14} />;
}

const EMOJIS = [
  '😀', '😂', '😊', '😍', '🤔', '😅', '😢', '😮',
  '👍', '🙏', '👏', '🤝', '🎉', '🔥', '❤️', '💯',
  '✅', '🚀', '📦', '📍', '⏰', '💬', '😎', '🙌',
];

function EmojiPickerButton({ onSelect }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="emoji-picker-wrap" ref={wrapRef}>
      <button
        type="button"
        className="chat-composer__tool-btn"
        onClick={() => setOpen((o) => !o)}
      >
        <img src={emojiIconUrl} width={16} height={16} alt="" />
      </button>
      {open && (
        <div className="emoji-picker">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="emoji-picker__item"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function IncomingBubble({ text, time }) {
  return (
    <div className="chat-message chat-message--incoming">
      <div className="chat-bubble chat-bubble--incoming">{text}</div>
      <span className="chat-message__time">{time}</span>
    </div>
  );
}

function OutgoingTextBubble({ text, time, sender, status = 'read', showStatus = true }) {
  return (
    <div className="chat-message chat-message--outgoing">
      <div className="chat-bubble chat-bubble--outgoing-card">{text}</div>
      <div className="chat-message__meta">
        <span>{sender}</span>
        <span className="chat-message__meta-dash">-</span>
        <span>{time}</span>
        {showStatus && <StatusTick status={status} />}
      </div>
    </div>
  );
}

// Canned replies used to simulate an incoming response for Chat/Slack.
const RANDOM_REPLIES = [
  'Thanks, got it!', 'Sure, let me check.', 'Sounds good 👍', 'On it!',
  'Perfect, appreciate it.', 'Okay, will do.', 'Great, thanks for the update.',
];
const randomReply = () => RANDOM_REPLIES[Math.floor(Math.random() * RANDOM_REPLIES.length)];

function TwentyFourHourBlock({ onChooseTemplate }) {
  return (
    <div className="reply-block">
      <div className="reply-block__inner">
        <div className="reply-block__text">
          <p className="reply-block__title">You’ve reached WhatsApp’s 24 hour reply limit</p>
          <p className="reply-block__body">
            Send a pre-approved template to restart the conversation. Once the customer replies, you
            can continue the conversation as usual.
          </p>
        </div>
        <button className="reply-block__cta" type="button" onClick={onChooseTemplate}>
          <img src={whatsappTemplateUrl} width={16} height={16} alt="" className="reply-block__cta-icon" />
          Choose a template
        </button>
      </div>
    </div>
  );
}

export default function ChatPanel({ channel = 'whatsapp', conversation, inboxName }) {
  const isWhatsApp = channel === 'whatsapp';
  const baseMessages = conversation?.messages || [];
  const [isBlocked, setIsBlocked] = useState(isWhatsApp && !!conversation?.blocked);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateModalKey, setTemplateModalKey] = useState(0);
  const [dynamicMessages, setDynamicMessages] = useState([]);
  const [composerText, setComposerText] = useState('');
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [templatePickerKey, setTemplatePickerKey] = useState(0);
  const [templatePickerAnchorLeft, setTemplatePickerAnchorLeft] = useState(0);
  const [templatePickerAnchorTop, setTemplatePickerAnchorTop] = useState(0);
  const threadRef = useRef(null);
  const composerWrapRef = useRef(null);
  const templateButtonRef = useRef(null);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [dynamicMessages, isBlocked]);

  useEffect(() => {
    if (!isTemplatePickerOpen) return undefined;
    function handleClickOutside(e) {
      if (composerWrapRef.current && !composerWrapRef.current.contains(e.target)) {
        setIsTemplatePickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTemplatePickerOpen]);

  function handleSendTemplate(template, values) {
    const msgId = `template-${Date.now()}`;
    const templateMessage = {
      id: msgId,
      kind: 'template',
      template,
      values,
      time: formatNow(),
      status: 'sent',
    };
    setDynamicMessages((prev) => [...prev, templateMessage]);

    // Simulate status progression with 1.5s gap: sent (single tick) -> delivered (double tick) -> read (blue double tick)
    setTimeout(() => {
      setDynamicMessages((prev) =>
        prev.map((msg) => (msg.id === msgId ? { ...msg, status: 'delivered' } : msg))
      );
    }, 1500);

    setTimeout(() => {
      setDynamicMessages((prev) =>
        prev.map((msg) => (msg.id === msgId ? { ...msg, status: 'read' } : msg))
      );
    }, 3000);

    // Simulate customer reply, lifting 24-hour block
    setTimeout(() => {
      setDynamicMessages((prev) => [
        ...prev,
        { id: `reply-${Date.now()}`, kind: 'incoming', text: 'Hello', time: formatNow() },
      ]);
      setIsBlocked(false);
    }, 3500);
  }

  function handleSendComposerMessage() {
    const text = composerText.trim();
    if (!text) return;
    const msgId = `agent-${Date.now()}`;
    setDynamicMessages((prev) => [
      ...prev,
      { id: msgId, kind: 'agent-text', text, time: formatNow(), status: 'sent' },
    ]);
    setComposerText('');

    if (isWhatsApp) {
      // WhatsApp shows the tick progression sent -> delivered -> read.
      setTimeout(() => {
        setDynamicMessages((prev) =>
          prev.map((msg) => (msg.id === msgId ? { ...msg, status: 'delivered' } : msg))
        );
      }, 1500);
      setTimeout(() => {
        setDynamicMessages((prev) =>
          prev.map((msg) => (msg.id === msgId ? { ...msg, status: 'read' } : msg))
        );
      }, 3000);
    } else {
      // Chat/Slack: no ticks — instead a random reply comes back after 2s.
      setTimeout(() => {
        setDynamicMessages((prev) => [
          ...prev,
          { id: `reply-${Date.now()}`, kind: 'incoming', text: randomReply(), time: formatNow() },
        ]);
      }, 2000);
    }
  }

  function handleComposerKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComposerMessage();
    }
  }

  const [openedViaIcon, setOpenedViaIcon] = useState(false);

  function handleComposerChange(e) {
    const val = e.target.value;
    if (isWhatsApp && val.startsWith('/') && !isTemplatePickerOpen) {
      setComposerText(val);
      openTemplatePickerAtComposer();
      return;
    }
    setComposerText(val);
  }

  function openTemplateModal() {
    setTemplateModalKey((key) => key + 1);
    setIsTemplateModalOpen(true);
  }

  function openTemplatePickerAtComposer() {
    setOpenedViaIcon(false);
    setIsTemplatePickerOpen(true);
    setTemplatePickerKey((key) => key + 1);
    if (composerWrapRef.current) {
      // 20px padding of composerWrapRef plus positioning right above the composer box (no gap)
      setTemplatePickerAnchorLeft(20);
      setTemplatePickerAnchorTop(20 - TEMPLATE_PICKER_POPOVER_HEIGHT);
    }
  }

  function toggleTemplatePicker() {
    setIsTemplatePickerOpen((wasOpen) => {
      if (!wasOpen) {
        setOpenedViaIcon(true);
        setTemplatePickerKey((key) => key + 1);
        if (templateButtonRef.current && composerWrapRef.current) {
          const btnRect = templateButtonRef.current.getBoundingClientRect();
          const wrapRect = composerWrapRef.current.getBoundingClientRect();
          const gap = 8;
          setTemplatePickerAnchorLeft(btnRect.left - wrapRect.left);
          setTemplatePickerAnchorTop(btnRect.top - wrapRect.top - gap - TEMPLATE_PICKER_POPOVER_HEIGHT);
        }
      } else {
        setOpenedViaIcon(false);
      }
      return !wasOpen;
    });
  }

  return (
    <div className={`chat-panel chat-panel--${channel}`}>
      <div className="chat-panel__topbar">
        <span className="chat-panel__topbar-avatar">
          {(conversation?.avatarInitial || conversation?.title || '?').charAt(0).toUpperCase()}
        </span>
        <span className="chat-panel__topbar-title">{conversation?.title}</span>
      </div>

      <div className="chat-panel__thread" ref={threadRef}>
        {baseMessages.map((m, i) =>
          m.kind === 'template' ? (
            // Outbound template sent from the "New WhatsApp message" composer.
            <div className="chat-message chat-message--outgoing" key={`base-${i}`}>
              <TemplatePreviewCard template={m.template} values={m.values} />
              <div className="chat-message__meta">
                <span>{m.sender || 'Arnold'} (sent via template)</span>
                <span className="chat-message__meta-dash">-</span>
                <span>{m.time}</span>
                <StatusTick status={m.status || 'read'} />
              </div>
            </div>
          ) : m.kind === 'incoming' ? (
            <IncomingBubble key={`base-${i}`} text={m.text} time={m.time} />
          ) : (
            <OutgoingTextBubble
              key={`base-${i}`}
              text={m.text}
              time={m.time}
              sender={m.sender}
              status={m.status || 'read'}
              showStatus={isWhatsApp}
            />
          )
        )}
        {dynamicMessages.map((entry) => {
          if (entry.kind === 'template') {
            return (
              <div className="chat-message chat-message--outgoing" key={entry.id}>
                <TemplatePreviewCard template={entry.template} values={entry.values} />
                <div className="chat-message__meta">
                  <span>Arnold (sent via template)</span>
                  <span className="chat-message__meta-dash">-</span>
                  <span>{entry.time}</span>
                  <StatusTick status={entry.status || 'read'} />
                </div>
              </div>
            );
          }
          if (entry.kind === 'agent-text') {
            return (
              <OutgoingTextBubble
                key={entry.id}
                text={entry.text}
                time={entry.time}
                sender="Arnold"
                status={entry.status || 'read'}
                showStatus={isWhatsApp}
              />
            );
          }
          return <IncomingBubble key={entry.id} text={entry.text} time={entry.time} />;
        })}
      </div>

      {conversation?.view !== 'Assigned to Bot' && (
        <div className="chat-panel__composer-wrap" ref={composerWrapRef}>
          {isBlocked ? (
            <TwentyFourHourBlock onChooseTemplate={openTemplateModal} />
          ) : (
            <div className="chat-composer">
              <textarea
                className="chat-composer__input"
                placeholder={
                  isWhatsApp
                    ? "Shift + Enter for new line. Type ‘/’ to search for WhatsApp templates and send quick replies"
                    : 'Shift + Enter for new line'
                }
                value={composerText}
                onChange={handleComposerChange}
                onKeyDown={handleComposerKeyDown}
              />
              <div className="chat-composer__toolbar">
                <div className="chat-composer__tools">
                  <EmojiPickerButton onSelect={(emoji) => setComposerText((prev) => prev + emoji)} />
                  <button className="chat-composer__tool-btn" type="button">
                    <img src={attachFileUrl} width={16} height={16} alt="" />
                  </button>
                  {isWhatsApp && (
                    <button
                      ref={templateButtonRef}
                      type="button"
                      className={
                        'chat-composer__tool-btn' +
                        (isTemplatePickerOpen && openedViaIcon ? ' chat-composer__tool-btn--active' : '')
                      }
                      onClick={toggleTemplatePicker}
                    >
                      <img src={whatsappTemplatesUrl} width={16} height={16} alt="" />
                    </button>
                  )}
                </div>
                <button
                  className="chat-composer__send"
                  type="button"
                  disabled={!composerText.trim()}
                  onClick={handleSendComposerMessage}
                >
                  Send
                </button>
              </div>
            </div>
          )}
          {isWhatsApp && isTemplatePickerOpen && (
            <TemplatePickerPopover
              key={templatePickerKey}
              anchorLeft={templatePickerAnchorLeft}
              anchorTop={templatePickerAnchorTop}
              onSend={handleSendTemplate}
              onDone={() => setIsTemplatePickerOpen(false)}
            />
          )}
        </div>
      )}

      {isWhatsApp && (
        <TemplateModal
          key={templateModalKey}
          open={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onSend={(template, values) =>
            sendTemplateInConversation(inboxName, conversation.id, template, values)
          }
          recipient={{ name: conversation?.name, phone: conversation?.phone }}
        />
      )}
    </div>
  );
}
