import { NextRequest, NextResponse } from 'next/server';
import { providerBaseUrlEnvKeys } from '@/utils/chat-assistant/constants';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const provider = url.searchParams.get('provider');

  if (!provider || !providerBaseUrlEnvKeys[provider]?.apiTokenKey) {
    return NextResponse.json({ isSet: false });
  }

  const envVarName = providerBaseUrlEnvKeys[provider].apiTokenKey;
  const isSet = !!(process.env[envVarName] || process.env[envVarName]);

  return NextResponse.json({ isSet });
}