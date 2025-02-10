// app/api/llm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { streamText } from '@/lib/llm/stream-text';
import type { IProviderSetting, ProviderInfo } from '@/types/model';
import { generateText } from 'ai';
import { PROVIDER_LIST } from '@/utils/chat-assistant/constants';
import { MAX_TOKENS } from '@/lib/llm/contants';
import { LLMManager } from '@/lib/modules/llm/manager';
import type { ModelInfo } from '@/lib/modules/llm/types';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '@/lib/api/cookies';
import { createScopedLogger } from '@/utils/chat-assistant/logger';

async function getModelList(options: {
  apiKeys?: Record<string, string>;
  providerSettings?: Record<string, IProviderSetting>;
  serverEnv?: Record<string, string>;
}) {
  const llmManager = LLMManager.getInstance(process.env);
  return llmManager.updateModelList(options);
}

const logger = createScopedLogger('api.llmcall');

export async function POST(request: NextRequest) {
  try {
    const { system, message, model, provider, streamOutput } = await request.json();

    const { name: providerName } = provider as ProviderInfo;

    // validate 'model' and 'provider' fields
    if (!model || typeof model !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing model' },
        { status: 400 }
      );
    }

    if (!providerName || typeof providerName !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing provider' },
        { status: 400 }
      );
    }

    const cookieStore = request.cookies;
    const apiKeys = getApiKeysFromCookie(cookieStore);
    const providerSettings = getProviderSettingsFromCookie(cookieStore);

    if (streamOutput) {
      try {
        const result = await streamText({
          options: {
            system,
          },
          messages: [
            {
              role: 'user',
              content: `${message}`,
            },
          ],
          env: process.env,
          apiKeys,
          providerSettings,
        });

        return new NextResponse(result.textStream, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      } catch (error: unknown) {
        console.log(error);

        if (error instanceof Error && error.message?.includes('API key')) {
          return NextResponse.json(
            { error: 'Invalid or missing API key' },
            { status: 401 }
          );
        }

        return NextResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        );
      }
    } else {
      const models = await getModelList({ apiKeys, providerSettings, serverEnv: process.env });
      const modelDetails = models.find((m: ModelInfo) => m.name === model);

      if (!modelDetails) {
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        );
      }

      const dynamicMaxTokens = modelDetails.maxTokenAllowed ?? MAX_TOKENS;

      const providerInfo = PROVIDER_LIST.find((p) => p.name === provider.name);

      if (!providerInfo) {
        return NextResponse.json(
          { error: 'Provider not found' },
          { status: 404 }
        );
      }

      logger.info(`Generating response Provider: ${provider.name}, Model: ${modelDetails.name}`);

      const result = await generateText({
        system,
        messages: [
          {
            role: 'user',
            content: `${message}`,
          },
        ],
        model: providerInfo.getModelInstance({
          model: modelDetails.name,
          serverEnv: process.env,
          apiKeys,
          providerSettings,
        }),
        maxTokens: dynamicMaxTokens,
        toolChoice: 'none',
      });
      
      logger.info(`Generated response`);

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}