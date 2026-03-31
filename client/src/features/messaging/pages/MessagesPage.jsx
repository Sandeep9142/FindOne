import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, Send } from 'lucide-react';
import Button from '@components/common/Button';
import { messageService } from '@services';
import { useAuthStore, useUIStore } from '@store';

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function formatTime(value) {
  return value ? new Date(value).toLocaleString() : '';
}

export default function MessagesPage() {
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(searchParams.get('conversation') || '');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    async function loadConversations() {
      setLoading(true);

      try {
        const conversationList = await messageService.getConversations();
        setConversations(conversationList);

        const requestedConversationId = searchParams.get('conversation');
        const nextConversationId = requestedConversationId || conversationList[0]?._id || '';
        setActiveConversationId(nextConversationId);
      } catch (error) {
        showToast(getErrorMessage(error, 'Unable to load conversations.'), 'error');
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, [searchParams, showToast]);

  useEffect(() => {
    async function loadMessages() {
      if (!activeConversationId) {
        setMessages([]);
        return;
      }

      setThreadLoading(true);

      try {
        const messageList = await messageService.getMessages(activeConversationId);
        setMessages(messageList);
        await messageService.markRead(activeConversationId);
        setConversations((current) =>
          current.map((conversation) =>
            conversation._id === activeConversationId
              ? { ...conversation, unreadCount: 0 }
              : conversation
          )
        );
      } catch (error) {
        showToast(getErrorMessage(error, 'Unable to load messages.'), 'error');
      } finally {
        setThreadLoading(false);
      }
    }

    loadMessages();
  }, [activeConversationId, showToast]);

  const activeConversation = conversations.find(
    (conversation) => conversation._id === activeConversationId
  );

  const participant = activeConversation?.participantIds?.find(
    (conversationUser) => conversationUser._id !== user?._id
  );

  async function handleSendMessage(event) {
    event.preventDefault();

    if (!activeConversationId || !draft.trim()) {
      return;
    }

    setSending(true);

    try {
      const message = await messageService.sendMessage(activeConversationId, {
        text: draft.trim(),
      });

      setMessages((current) => [...current, message]);
      setConversations((current) =>
        current.map((conversation) =>
          conversation._id === activeConversationId
            ? { ...conversation, lastMessageId: message, lastMessageAt: message.createdAt }
            : conversation
        )
      );
      setDraft('');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to send message.'), 'error');
    } finally {
      setSending(false);
    }
  }

  function selectConversation(conversationId) {
    setActiveConversationId(conversationId);
    setSearchParams(conversationId ? { conversation: conversationId } : {});
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
        Loading conversations...
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="px-2 pb-4">
          <h2 className="text-2xl font-bold text-dark">Messages</h2>
          <p className="text-sm text-slate-500 mt-1">Chat with workers or clients</p>
        </div>

        <div className="space-y-2">
          {conversations.length > 0 ? (
            conversations.map((conversation) => {
              const otherParticipant = conversation.participantIds?.find(
                (conversationUser) => conversationUser._id !== user?._id
              );

              return (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => selectConversation(conversation._id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                    conversation._id === activeConversationId
                      ? 'border-primary-200 bg-primary-50'
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {otherParticipant?.fullName || 'Conversation'}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {conversation.lastMessageId?.text || 'No messages yet'}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-500 px-2 text-xs font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
              No conversations yet.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white shadow-sm">
        {activeConversation ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {participant?.fullName || 'Conversation'}
                </h3>
                <p className="text-sm text-slate-500 capitalize">
                  {participant?.role || 'member'}
                </p>
              </div>
            </div>

            <div className="max-h-[520px] space-y-4 overflow-y-auto px-6 py-6">
              {threadLoading ? (
                <div className="text-center text-sm text-slate-500">Loading messages...</div>
              ) : messages.length > 0 ? (
                messages.map((message) => {
                  const isOwnMessage = message.senderId?._id === user?._id;

                  return (
                    <div
                      key={message._id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <article
                        className={`max-w-[75%] rounded-3xl px-4 py-3 ${
                          isOwnMessage
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <p className="text-sm leading-6">{message.text}</p>
                        <p
                          className={`mt-2 text-[11px] ${
                            isOwnMessage ? 'text-white/70' : 'text-slate-500'
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </p>
                      </article>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-sm text-slate-500">No messages yet.</div>
              )}
            </div>

            <form className="border-t border-slate-100 p-4" onSubmit={handleSendMessage}>
              <div className="flex items-end gap-3">
                <textarea
                  className="min-h-14 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  placeholder="Type your message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <Button type="submit" variant="primary" size="lg" loading={sending}>
                  <Send size={16} />
                  Send
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
            <MessageSquare size={40} className="text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Pick a conversation to start chatting.</p>
          </div>
        )}
      </section>
    </div>
  );
}
