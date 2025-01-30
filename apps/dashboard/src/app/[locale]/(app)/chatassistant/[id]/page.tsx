"use client"

import React from 'react';
import IndexRoute from '../page'
import dynamic from 'next/dynamic';
const ChatComponent = dynamic(
  () => import('@/components/chat-assistant/chat/Chat.client'),
  {
    // ssr: false,
    // loading: () => <BaseChat />,
  }
);
type ChatIdPageProps = {
  params: { id: string };
};

export default function ChatIdPage({ params }: ChatIdPageProps) {
  return (
    <div>
         <ChatComponent />
    </div>
  );
}
