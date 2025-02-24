import { IconButton } from '@/components/chat-assistant/ui/IconButton';
import { classNames } from '@/utils/chat-assistant/classNames';
import React from 'react';

export const SpeechRecognitionButton = ({
  isListening,
  onStart,
  onStop,
  disabled,
}: {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
}) => {
  return (
    <IconButton
      title={isListening ? 'Stop listening' : 'Start speech recognition'}
      disabled={disabled}
      className={classNames('transition-all', {
        'text-bolt-elements-item-contentAccent': isListening,
      })}
      onClick={isListening ? onStop : onStart}
    >
      {isListening ? <div className="i-ph:microphone-slash dark:text-white/50 text-black/20 text-xl" /> : <div className="i-ph:microphone text-xl" />}
    </IconButton>
  );
};
