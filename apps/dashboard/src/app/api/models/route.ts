import type { NextApiRequest, NextApiResponse } from 'next';
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

export async function getModelsHandler(req: NextApiRequest, res: NextApiResponse) {
  const { provider } = req.query;
  const llmManager = LLMManager.getInstance(process.env);

  const cookieHeader = req.headers.cookie;
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  const providerSettings = getProviderSettingsFromCookie(cookieHeader);

  const { providers, defaultProvider } = getProviderInfo(llmManager);

  let modelList: ModelInfo[] = [];

  if (typeof provider === 'string') {
    const providerInstance = llmManager.getProvider(provider);
    if (providerInstance) {
      modelList = await llmManager.getModelListFromProvider(providerInstance, {
        apiKeys,
        providerSettings,
        serverEnv: process.env,
      });
    }
  } else {
    modelList = await llmManager.updateModelList({
      apiKeys,
      providerSettings,
      serverEnv: process.env,
    });
  }

  res.status(200).json({
    modelList,
    providers,
    defaultProvider,
  });
}
