"use client";

import type { ClientMessage } from "@/actions/ai/types";
import { useEnterSubmit } from "@/hooks/use-enter-submit";
import { useScrollAnchor } from "@/hooks/use-scroll-anchor";
import { useAssistantStore } from "@/store/assistant";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Textarea } from "@midday/ui/textarea";
import { useActions } from "ai/rsc";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { ChatEmpty } from "./chat-empty";
import { ChatExamples } from "./chat-examples";
import { ChatFooter } from "./chat-footer";
import { ChatList } from "./chat-list";
import { UserMessage } from "./messages";
import { ImageIcon, PaperclipIcon, SearchIcon, Mic } from "lucide-react";
import { VoiceRecorderModal } from "../voice-recorder/voice-recorder-modal";

export function Chat({
  messages,
  submitMessage,
  user,
  onNewChat,
  input,
  setInput,
  showFeedback,
}) {
  const { submitUserMessage } = useActions();
  const { formRef, onKeyDown } = useEnterSubmit();
  const ref = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { message } = useAssistantStore();

  const onSubmit = async (input: string) => {
    const value = input.trim();

    if (value.length === 0) {
      return null;
    }

    setInput("");
    scrollToBottom();

    submitMessage((message: ClientMessage[]) => [
      ...message,
      {
        id: nanoid(),
        role: "user",
        display: <UserMessage>{value}</UserMessage>,
      },
    ]);

    const responseMessage = await submitUserMessage(value);

    submitMessage((messages: ClientMessage[]) => [
      ...messages,
      responseMessage,
    ]);
  };

  useEffect(() => {
    if (!ref.current && message) {
      onNewChat();
      onSubmit(message);
      ref.current = true;
    }
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef?.current.focus();
    });
  }, [messages]);

  const { messagesRef, scrollRef, visibilityRef, scrollToBottom } =
    useScrollAnchor();

  const showExamples = messages.length === 0 && !input;

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Handle file upload logic here
      console.log("File selected:", files[0]);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Handle image upload logic here
      console.log("Image selected:", files[0]);
    }
  };

  const handleWebSearch = async () => {
    if (!input.trim()) return;
    
    setInput("");
    scrollToBottom();

    submitMessage((message: ClientMessage[]) => [
      ...message,
      {
        id: nanoid(),
        role: "user",
        display: <UserMessage>🔍 Searching web for: {input}</UserMessage>,
      },
    ]);

    try {
      // Here you would integrate with your web search API
      const searchResponse = await fetch('/api/web-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      });

      if (!searchResponse.ok) {
        throw new Error('Search failed');
      }

      const results = await searchResponse.json();

      submitMessage((messages: ClientMessage[]) => [
        ...messages,
        {
          id: nanoid(),
          role: "assistant",
          display: <UserMessage>Here are the search results: {JSON.stringify(results)}</UserMessage>,
        },
      ]);
    } catch (error) {
      submitMessage((messages: ClientMessage[]) => [
        ...messages,
        {
          id: nanoid(),
          role: "assistant",
          display: <UserMessage>Sorry, I couldn't perform the web search. Please try again.</UserMessage>,
        },
      ]);
    }
  };

  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);

  const handleVoiceRecording = (audioBlob: Blob) => {
    // Here you can handle the recorded audio blob
    // For example, upload it to your server or process it
    console.log('Recorded audio blob:', audioBlob);
    
    // Create a temporary URL for the audio
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Add the voice message to the chat
    submitMessage((message: ClientMessage[]) => [
      ...message,
      {
        id: nanoid(),
        role: "user",
        display: (
          <UserMessage>
            <div>
              <p>🎤 Voice Message</p>
              <audio src={audioUrl} controls className="mt-2" />
            </div>
          </UserMessage>
        ),
      },
    ]);
  };

  return (
    <div className="relative">
      <ScrollArea className="todesktop:h-[335px] md:h-[335px]" ref={scrollRef}>
        <div ref={messagesRef}>
          {messages.length ? (
            <ChatList messages={messages} className="p-4 pb-8" />
          ) : (
            <ChatEmpty firstName={user?.full_name.split(" ").at(0)} />
          )}

          <div className="w-full h-px" ref={visibilityRef} />
        </div>
      </ScrollArea>

      <div className="fixed bottom-[1px] left-[1px] right-[1px] todesktop:h-[88px] md:h-[88px] bg-background border-border border-t-[1px]">
        {showExamples && <ChatExamples onSubmit={onSubmit} />}

        <form
          ref={formRef}
          onSubmit={(evt) => {
            evt.preventDefault();
            onSubmit(input);
          }}
          className="relative px-4 pb-4"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
          <div className="relative flex items-center">
            <div className="absolute left-3 flex gap-2">
              <button
                type="button"
                onClick={handleImageClick}
                className="p-1 hover:bg-accent rounded-sm"
              >
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={handleFileClick}
                className="p-1 hover:bg-accent rounded-sm"
              >
                <PaperclipIcon className="h-5 w-5 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={handleWebSearch}
                className="p-1 hover:bg-accent rounded-sm"
              >
                <SearchIcon className="h-5 w-5 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => setIsVoiceRecorderOpen(true)}
                className="p-1 hover:bg-accent rounded-sm"
              >
                <Mic className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <Textarea
              ref={inputRef}
              tabIndex={0}
              onKeyDown={onKeyDown}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Midday..."
              spellCheck={false}
              className="resize-none pr-14 pl-20 py-3 max-h-48"
            />
          </div>
        </form>

        <ChatFooter
          onSubmit={() => onSubmit(input)}
          showFeedback={showFeedback}
        />
      </div>

      <VoiceRecorderModal
        isOpen={isVoiceRecorderOpen}
        onClose={() => setIsVoiceRecorderOpen(false)}
        onSave={handleVoiceRecording}
      />
    </div>
  );
}
