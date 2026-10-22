import React, { useState } from 'react';
import ConversationList from './ChannelConversationList/ConversationList';
import SlackConversationList from './SlackConversationList/SlackConversationList';
import ChatPanel from './ChatPanel/ChatPanel';
import SlackChatPanel from './SlackChatPanel/SlackChatPanel';
import RightPanel from './RightPanel';
import { CHANNEL_BY_INBOX, CHANNEL_CHATS } from '../data/channelChats';

/**
 * Chat-style view for Chat / Slack / WhatsApp Shared Inboxes.
 * Slack uses its own conversation list + chat panel; every channel uses the
 * same (Email) accordion Right Panel.
 */
export default function ChannelChatView({ inboxName, viewType = 'Mine' }) {
  const channel = CHANNEL_BY_INBOX[inboxName] || 'chat';
  const all = CHANNEL_CHATS[inboxName] || [];
  // Show only the conversations for the active view (e.g. Unassigned).
  const conversations = all.filter((c) => c.view === viewType);
  const [selectedId, setSelectedId] = useState(conversations[0]?.id);

  const conversation = conversations.find((c) => c.id === selectedId) || conversations[0];
  const isSlack = channel === 'slack';

  return (
    <>
      {isSlack ? (
        <SlackConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          title={viewType}
        />
      ) : (
        <ConversationList
          channel={channel}
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          title={viewType}
        />
      )}

      {isSlack ? (
        <SlackChatPanel key={selectedId} inboxName={inboxName} conversation={conversation} />
      ) : (
        <ChatPanel key={selectedId} channel={channel} conversation={conversation} inboxName={inboxName} />
      )}

      <RightPanel
        inboxName={`${inboxName} Inbox`}
        channel={channel}
        assignee={conversation?.assignee}
        contact={{
          name: conversation?.name || conversation?.title,
          email: conversation?.email,
          phone: conversation?.phone,
        }}
      />
    </>
  );
}
