import { createParser } from 'eventsource-parser';
import type { Messages, StreamingOptions } from '@/types/chat';
import { createScopedLogger } from '@/utils/chat-assistant/logger';

const logger = createScopedLogger('stream-text');

export async function streamText(
  messages: Messages,
  options: StreamingOptions
): Promise<ReadableStream> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const { maxTokens, apiKeys, providerSettings, model, provider } = options;

  let counter = 0;
  
  async function* makeGenerator() {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKeys?.[provider.name]}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate text');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const parser = createParser((event) => {
        if (event.type === 'event') {
          try {
            const data = JSON.parse(event.data);
            const text = data.choices[0]?.delta?.content || '';
            if (text) {
              options.onToken?.();
              return encoder.encode(text);
            }
          } catch (error) {
            logger.error('Error parsing SSE message:', error);
          }
        }
      });

      const reader = response.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          parser.feed(chunk);
          
          if (options.maxResponseSegments && counter++ >= options.maxResponseSegments) {
            break;
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      logger.error('Error in streamText:', error);
      yield encoder.encode(`Error: ${error.message}`);
    }
  }

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of makeGenerator()) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}
