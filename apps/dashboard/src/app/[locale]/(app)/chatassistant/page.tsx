"use client"
import dynamic from 'next/dynamic';
import  BaseChat  from '@/components/chat-assistant/chat/BaseChat';
import  Header  from '@/components/chat-assistant/header/Header';

const ChatComponent = dynamic(
  () => import('@/components/chat-assistant/chat/Chat.client'),
  {
    // ssr: false,
    // loading: () => <BaseChat />,
  }
);

export default function Page() {
  return (
    <div className="flex flex-col h-full  w-full bg-bolt-elements-background-depth-1">
      <Header/>
      <div className='w-full items-center justify-center flex'>
      <ChatComponent />
      </div>
    </div>
  );
}
