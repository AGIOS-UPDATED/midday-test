'use client';

import { type FC } from 'react';
import { FiMessageSquare, FiTrash2, FiEdit2 } from 'react-icons/fi';
import Link from 'next/link';
import { clsx } from 'clsx';

interface HistoryItemProps {
  id: string;
  title: string;
  timestamp: Date;
  isSelected?: boolean;
  isEditing?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onTitleChange?: (newTitle: string) => void;
  onTitleSubmit?: () => void;
}

export const HistoryItem: FC<HistoryItemProps> = ({
  id,
  title,
  timestamp,
  isSelected = false,
  isEditing = false,
  onEdit,
  onDelete,
  onTitleChange,
  onTitleSubmit,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onTitleSubmit) {
      onTitleSubmit();
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else if (diffInMinutes < 7 * 24 * 60) {
      const days = Math.floor(diffInMinutes / (24 * 60));
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div
      className={clsx(
        'group flex items-center px-3 py-2 text-sm',
        isSelected
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-600 hover:bg-gray-50'
      )}
    >
      <FiMessageSquare
        className={clsx(
          'mr-3 h-4 w-4 flex-shrink-0',
          isSelected ? 'text-gray-500' : 'text-gray-400'
        )}
      />

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            autoFocus
          />
        ) : (
          <Link
            href={`/chat/${id}`}
            className={clsx(
              'block truncate',
              isSelected ? 'font-medium' : 'font-normal'
            )}
          >
            {title}
          </Link>
        )}
        <p
          className={clsx(
            'truncate text-xs',
            isSelected ? 'text-gray-500' : 'text-gray-400'
          )}
        >
          {formatTimestamp(timestamp)}
        </p>
      </div>

      <div className="ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && !isEditing && (
          <button
            onClick={onEdit}
            className="mr-2 text-gray-400 hover:text-gray-500"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-gray-500"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
