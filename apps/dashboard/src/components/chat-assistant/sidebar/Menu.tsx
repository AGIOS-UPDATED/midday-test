'use client';

import { type FC, useState, useEffect } from 'react';
import {
  FiPlus,
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiSettings,
  FiHelpCircle,
} from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { HistoryItem } from './HistoryItem';
import { binByDate, type DateBin } from './date-binning';

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
}

interface MenuProps {
  history: ChatHistory[];
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onEditChatTitle: (id: string, newTitle: string) => void;
  onSettingsClick: () => void;
  onHelpClick: () => void;
}

export const Menu: FC<MenuProps> = ({
  history,
  onNewChat,
  onDeleteChat,
  onEditChatTitle,
  onSettingsClick,
  onHelpClick,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [expandedBins, setExpandedBins] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  const currentChatId = pathname?.split('/').pop();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleBin = (label: string) => {
    setExpandedBins((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const startEditing = (chat: ChatHistory) => {
    setEditingId(chat.id);
    setEditingTitle(chat.title);
  };

  const submitEdit = () => {
    if (editingId && editingTitle.trim()) {
      onEditChatTitle(editingId, editingTitle.trim());
      setEditingId(null);
      setEditingTitle('');
    }
  };

  const dateBins: DateBin[] = binByDate(history, (item) => item.timestamp);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 md:hidden z-40 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
      >
        {isOpen ? (
          <FiX className="h-6 w-6" />
        ) : (
          <FiMenu className="h-6 w-6" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-full',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-4 flex items-center justify-between border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-2">
              <img
                src="/logo.svg"
                alt="Cascade Logo"
                className="h-8 w-8"
              />
              <span className="text-xl font-semibold text-gray-900">
                Cascade
              </span>
            </Link>
          </div>

          {/* New Chat Button */}
          <div className="flex-shrink-0 px-4 py-4">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiPlus className="mr-2 -ml-1 h-5 w-5" />
              New Chat
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto">
            {dateBins.map(({ label, items }) => (
              <div key={label}>
                <button
                  onClick={() => toggleBin(label)}
                  className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <span>{label}</span>
                  {expandedBins.has(label) ? (
                    <FiChevronDown className="h-4 w-4" />
                  ) : (
                    <FiChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedBins.has(label) && (
                  <div className="space-y-1">
                    {(items as ChatHistory[]).map((chat) => (
                      <HistoryItem
                        key={chat.id}
                        id={chat.id}
                        title={chat.title}
                        timestamp={chat.timestamp}
                        isSelected={chat.id === currentChatId}
                        isEditing={chat.id === editingId}
                        onEdit={() => startEditing(chat)}
                        onDelete={() => onDeleteChat(chat.id)}
                        onTitleChange={setEditingTitle}
                        onTitleSubmit={submitEdit}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              <button
                onClick={onSettingsClick}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
              >
                <FiSettings className="mr-3 h-4 w-4" />
                Settings
              </button>
              <button
                onClick={onHelpClick}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
              >
                <FiHelpCircle className="mr-3 h-4 w-4" />
                Help & FAQ
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
