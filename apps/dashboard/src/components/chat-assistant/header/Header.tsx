"use client"
import { useStore } from '@nanostores/react';
import { chatStore } from '@/lib/stores/chat';
import { menuOpenStore } from '@/lib/stores/menu';
import { classNames } from '@/utils/chat-assistant/classNames';
import HeaderActionButtons from './HeaderActionButtons';
import ChatDescription from '@/lib/persistence/ChatDescription.client';

const Header = () => {
  const chat = useStore(chatStore);

  const toggleMenu = () => {
    menuOpenStore.set(!menuOpenStore.get());
  };

  return (
    <header
      className={classNames('flex items-center p-5 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary">
        <button 
          onClick={toggleMenu}
          className="p-2 hover:bg-bolt-elements-sidebar-buttonBackgroundHover rounded-md transition-theme"
          aria-label="Toggle Menu"
        >
          <div className="i-ph:sidebar-simple-duotone text-xl" />
        </button>
        <a href="/" className="text-2xl font-semibold text-accent flex items-center cursor-pointer">
          {/* <span className="i-bolt:logo-text?mask w-[46px] inline-block" /> */}
          {/* <img src="/updated-light.png" alt="logo" className="w-[120px] inline-block dark:hidden" />
          <img src="/updated-dark.png" alt="logo" className="w-[120px] inline-block hidden dark:block" /> */}
        </a>
      </div>
      {chat.started && ( // Display ChatDescription and HeaderActionButtons only when the chat has started.
        <>
          <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
            {/* <ChatDescription /> */}
          </span>
       
              <div className="mr-1">
                {/* <HeaderActionButtons /> */}
              </div>
        
        </>
      )}
    </header>
  );
}

Header.displayname='Header'
export default Header ;