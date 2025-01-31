import { NextRequest, NextResponse } from 'next/server';
import { streamText } from '@/lib/.server/llm/stream-text';
import { stripIndents } from '@/utils/stripIndent';
import type { ProviderInfo } from '@/types/model';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '@/lib/api/cookies';

export async function POST(req: NextRequest) {
  return enhancerAction(req);
}

async function enhancerAction(req: NextRequest) {
  const { message, model, provider } = await req.json<{ 
    message: string; 
    model: string; 
    provider: ProviderInfo; 
    apiKeys?: Record<string, string>; 
  }>();

  const { name: providerName } = provider;

  if (!model || typeof model !== 'string') {
    return new NextResponse('Invalid or missing model', { status: 400 });
  }

  if (!providerName || typeof providerName !== 'string') {
    return new NextResponse('Invalid or missing provider', { status: 400 });
  }

  const cookieHeader = req.headers.get('Cookie');
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  const providerSettings = getProviderSettingsFromCookie(cookieHeader);

  try {
    const result = await streamText({
      messages: [
        {
          role: 'user',
          content:
            `[Model: ${model}]

[Provider: ${providerName}]

` +
            stripIndents`
            You are a professional prompt engineer specializing in crafting precise, effective prompts.
            Your task is to enhance prompts by making them more specific, actionable, and effective.

            I want you to improve the user prompt that is wrapped in \`<original_prompt>\` tags.

            For valid prompts:
            - Make instructions explicit and unambiguous
            - Add relevant context and constraints
            - Remove redundant information
            - Maintain the core intent
            - Ensure the prompt is self-contained
            - Use professional language

            For invalid or unclear prompts:
            - Respond with clear, professional guidance
            - Keep responses concise and actionable
            - Maintain a helpful, constructive tone
            - Focus on what the user should provide
            - Use a standard template for consistency

            IMPORTANT: Your response must ONLY contain the enhanced prompt text.
            Do not include any explanations, metadata, or wrapper tags.

            <original_prompt>
              ${message}
            </original_prompt>
          `,
        },
      ],
      env: process.env, 
      apiKeys,
      providerSettings,
    });

    return new NextResponse(result.textStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
        'Text-Encoding': 'chunked',
      },
    });
  } catch (error: unknown) {
    console.log(error);

    if (error instanceof Error && error.message?.includes('API key')) {
      return new NextResponse('Invalid or missing API key', { status: 401 });
    }

    return new NextResponse(null, { status: 500 });
  }
}

export const config = {
  matcher: '/api/enhance-prompt',
};
