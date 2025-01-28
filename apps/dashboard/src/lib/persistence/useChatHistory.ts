'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { atom } from 'nanostores';
import { toast } from 'react-toastify';

import type { Message } from 'ai';

// If you have these stores in separate files, import them here
import { workbenchStore } from '@/lib/stores/workbench';
import { logStore } from '@/lib/stores/logs';

// Replace process.env.NEXT_PUBLIC_DISABLE_PERSISTENCE
// with whatever environment variable or config you use in Next.js
const persistenceEnabled = !process.env.NEXT_PUBLIC_DISABLE_PERSISTENCE;

// These are the DB helper functions you provided.
// Make sure they're imported from wherever you define them.
import {
  getMessages,
  getNextId,
  getUrlId,
  openDatabase,
  setMessages,
  duplicateChat,
  createChatFromMessages,
} from './db';

/**
 * ChatHistoryItem describes the shape of a single chat in the database.
 */
export interface ChatHistoryItem {
  id: string;
  urlId?: string;
  description?: string;
  messages: Message[];
  timestamp: string;
}

/**
 * If persistence is enabled, open the database once.
 * Otherwise, `db` will be undefined.
 */
export const db = persistenceEnabled ? await openDatabase() : undefined;

export const chatId = atom<string | undefined>(undefined);
export const description = atom<string | undefined>(undefined);

/**
 * A hook that provides chat history management logic.
 * This is an adaptation of the Remix version, now in Next.js style.
 */
export function useChatHistory() {
  // Next.js navigational hooks
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // This assumes you have a dynamic route segment `[id]` in your folder structure,
  // e.g., `app/chat/[id]/page.tsx`. If your segment name differs, update accordingly.
  const mixedId = params.id as string | undefined;

  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const [urlId, setUrlId] = useState<string | undefined>();

  /**
   * On mount, if `db` is available and there's an `id` in the URL,
   * attempt to load messages from IndexedDB. Otherwise, show an error
   * or redirect to home.
   */
  useEffect(() => {
    // If DB is not enabled or failed to initialize
    if (!db) {
      setReady(true);

      if (persistenceEnabled) {
        const error = new Error('Chat persistence is unavailable');
        logStore.logError('Chat persistence initialization failed', error);
        toast.error('Chat persistence is unavailable');
      }
      return;
    }

    // If we have a route param for the chat ID, load it:
    if (mixedId) {
      getMessages(db, mixedId)
        .then((storedMessages) => {
          if (storedMessages && storedMessages.messages.length > 0) {
            const rewindId = searchParams.get('rewindTo');
            const filteredMessages = rewindId
              ? storedMessages.messages.slice(
                  0,
                  storedMessages.messages.findIndex((m) => m.id === rewindId) + 1
                )
              : storedMessages.messages;

            setInitialMessages(filteredMessages);
            setUrlId(storedMessages.urlId);
            description.set(storedMessages.description);
            chatId.set(storedMessages.id);
          } else {
            // If no messages for this ID, return to home
            router.replace('/');
          }
          setReady(true);
        })
        .catch((error) => {
          logStore.logError('Failed to load chat messages', error);
          toast.error(error.message);
        });
    } else {
      // If there's no param, you might still mark it ready
      setReady(true);
    }
  }, [mixedId, searchParams, router]);

  /**
   * Utility function to store a new set of messages in the DB.
   */
  async function storeMessageHistory(messages: Message[]) {
    if (!db || messages.length === 0) {
      return;
    }

    const { firstArtifact } = workbenchStore;

    // If we don’t have a urlId yet but do have an artifact ID, try to derive the urlId
    if (!urlId && firstArtifact?.id) {
      const foundUrlId = await getUrlId(db, firstArtifact.id);
      navigateChat(foundUrlId);
      setUrlId(foundUrlId);
    }

    // If no description is set but we have a title from the artifact
    if (!description.get() && firstArtifact?.title) {
      description.set(firstArtifact?.title);
    }

    // If this is the first time storing, we need to create a new chat ID
    if (initialMessages.length === 0 && !chatId.get()) {
      const nextId = await getNextId(db);
      chatId.set(nextId);

      // If we don’t have a URL-based ID, navigate with the new one
      if (!urlId) {
        navigateChat(nextId);
      }
    }

    await setMessages(
      db,
      chatId.get() as string,
      messages,
      urlId,
      description.get()
    );
  }

  /**
   * Duplicate the current chat in the DB and navigate to the new copy.
   */
  async function duplicateCurrentChat(listItemId: string) {
    if (!db || (!mixedId && !listItemId)) {
      return;
    }

    try {
      const newId = await duplicateChat(db, mixedId || listItemId);
      router.push(`/chat/${newId}`);
      toast.success('Chat duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate chat');
      console.error(error);
    }
  }

  /**
   * Create a brand new chat from a set of messages.
   */
  async function importChat(importDescription: string, messages: Message[]) {
    if (!db) {
      return;
    }

    try {
      const newId = await createChatFromMessages(
        db,
        importDescription,
        messages
      );
      // You can do `router.push` here as well; using window.href is also fine:
      window.location.href = `/chat/${newId}`;
      toast.success('Chat imported successfully');
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Failed to import chat: ' + error.message);
      } else {
        toast.error('Failed to import chat');
      }
    }
  }

  /**
   * Export the current chat to a .json file.
   */
  async function exportChat(id = urlId) {
    if (!db || !id) {
      return;
    }

    const chat = await getMessages(db, id);
    const chatData = {
      messages: chat.messages,
      description: chat.description,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Replaces the current route with a new `/chat/...` path, without causing
   * a full re-render that breaks the app. If you want to do a normal Next.js
   * navigation, you can do `router.replace('/chat/' + nextId)`.
   */
  function navigateChat(nextId: string) {
    // The original comment explained a bug with Remix’s useNavigate, so
    // we replicate the "manual" history replacement here if needed:
    const url = new URL(window.location.href);
    url.pathname = `/chat/${nextId}`;

    window.history.replaceState({}, '', url);
  }

  return {
    ready: !mixedId || ready,
    initialMessages,
    storeMessageHistory,
    duplicateCurrentChat,
    importChat,
    exportChat,
  };
}
