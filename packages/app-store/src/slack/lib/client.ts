import { LogLevel, App as SlackApp } from "@slack/bolt";
import { InstallProvider } from "@slack/oauth";
import { WebClient } from "@slack/web-api";

const SLACK_CLIENT_ID = "2233445549680.8303582769572";
const SLACK_CLIENT_SECRET = "463b8fe2c4af4eb16be8a44c94deb29c";
const SLACK_OAUTH_REDIRECT_URL = "https://ypynmbwkszeqklsfbwwu.supabase.co/auth/v1/callback";
const SLACK_STATE_SECRET = process.env.NEXT_PUBLIC_SLACK_STATE_SECRET;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

export const slackInstaller = new InstallProvider({
  clientId: SLACK_CLIENT_ID,
  clientSecret: SLACK_CLIENT_SECRET,
  stateSecret: SLACK_STATE_SECRET,
  redirectUri: SLACK_OAUTH_REDIRECT_URL,
  logLevel: process.env.NODE_ENV === "development" ? LogLevel.DEBUG : undefined,
});

export const createSlackApp = ({
  token,
  botId,
}: { token: string; botId: string }) => {
  return new SlackApp({
    signingSecret: SLACK_SIGNING_SECRET,
    token,
    botId,
  });
};

export const createSlackWebClient = ({
  token,
}: {
  token: string;
}) => {
  return new WebClient(token);
};

export const getInstallUrl = ({
  teamId,
  userId,
}: { teamId: string; userId: string }) => {
  return slackInstaller.generateInstallUrl({
    scopes: [
      "incoming-webhook",
      "chat:write",
      "chat:write.public",
      "team:read",
      "assistant:write",
      "im:history",
      "commands",
      "files:read",
    ],
    metadata: JSON.stringify({ teamId, userId }),
  });
};

export const downloadFile = async ({
  privateDownloadUrl,
  token,
}: { privateDownloadUrl: string; token: string }) => {
  const response = await fetch(privateDownloadUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.arrayBuffer();
};
