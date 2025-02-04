"use client"
import dynamic from 'next/dynamic';
import  BaseChat  from '@/components/chat-assistant/chat/BaseChat';
import  Header  from '@/components/chat-assistant/header/Header';
import  'react-toastify/dist/ReactToastify.css';
import '../../../../../styles/chat-assistant-styles/index.scss';


const ChatComponent = dynamic(
  () => import('@/components/chat-assistant/chat/Chat.client'),
  {
    // ssr: false,
    // loading: () => <BaseChat />,
  }
);

export default function Page() {
  return (
    <div className="flex flex-col h-full  w-full ">
      <Header/>
  
      <ChatComponent />
 
    </div>
  );
}
