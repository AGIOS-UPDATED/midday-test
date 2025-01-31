// app/api/models/[[...provider]]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LLMManager } from '@/lib/modules/llm/manager';
import type { ModelInfo } from '@/lib/modules/llm/types';
import type { ProviderInfo } from '@/types/model';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '@/lib/api/cookies';

interface ModelsResponse {
  modelList: ModelInfo[];
  providers: ProviderInfo[];
  defaultProvider: ProviderInfo;
}

let cachedProviders: ProviderInfo[] | null = null;
let cachedDefaultProvider: ProviderInfo | null = null;

function getProviderInfo(llmManager: LLMManager) {
  if (!cachedProviders) {
    cachedProviders = llmManager.getAllProviders().map((provider) => ({
      name: provider.name,
      staticModels: provider.staticModels,
      getApiKeyLink: provider.getApiKeyLink,
      labelForGetApiKey: provider.labelForGetApiKey,
      icon: provider.icon,
    }));
  }

  if (!cachedDefaultProvider) {
    const defaultProvider = llmManager.getDefaultProvider();
    cachedDefaultProvider = {
      name: defaultProvider.name,
      staticModels: defaultProvider.staticModels,
      getApiKeyLink: defaultProvider.getApiKeyLink,
      labelForGetApiKey: defaultProvider.labelForGetApiKey,
      icon: defaultProvider.icon,
    };
  }

  return { providers: cachedProviders, defaultProvider: cachedDefaultProvider };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { provider?: string[] } }
): Promise<NextResponse<ModelsResponse>> {
  // Initialize LLMManager with environment variables
  const llmManager = LLMManager.getInstance(process.env);

  // Get cookies from the request
  const cookieStore = request.cookies;
  const apiKeys = getApiKeysFromCookie(cookieStore);
  const providerSettings = getProviderSettingsFromCookie(cookieStore);

  const { providers, defaultProvider } = getProviderInfo(llmManager);

  let modelList: ModelInfo[] = [];
  const providerParam = params.provider?.[0];

  if (providerParam) {
    // Only update models for the specific provider
    const provider = llmManager.getProvider(providerParam);

    if (provider) {
      modelList = await llmManager.getModelListFromProvider(provider, {
        apiKeys,
        providerSettings,
        serverEnv: process.env,
      });
    }
  } else {
    // Update all models
    modelList = await llmManager.updateModelList({
      apiKeys,
      providerSettings,
      serverEnv: process.env,
    });
  }

  return NextResponse.json({
    modelList,
    providers,
    defaultProvider,
  });
}