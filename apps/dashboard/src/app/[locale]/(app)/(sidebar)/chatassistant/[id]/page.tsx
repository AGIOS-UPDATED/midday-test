"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import  'react-toastify/dist/ReactToastify.css';
import '../../../../../../styles/chat-assistant-styles/index.scss';
import  Header  from '@/components/chat-assistant/header/Header';

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
    <div className="flex flex-col h-full  w-full ">
    <Header/>

    <ChatComponent />

  </div>
  );
}
