import {
  config,
  handleSlackEvent,
  verifySlackRequest,
} from "@midday/app-store/slack";
import { createClient } from "@midday/supabase/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const SLACK_SIGNING_SECRET = "your_signing_secret"; // Replace with actual signing secret

export async function POST(req: Request) {
  const rawBody = await req.text();

  const { challenge, team_id, event } = JSON.parse(rawBody);

  if (challenge) {
    return new NextResponse(challenge);
  }

  try {
    verifySlackRequest({
      signingSecret: SLACK_SIGNING_SECRET,
      body: rawBody,
      // @ts-expect-error - headers are not typed
      headers: Object.fromEntries(headers().entries()),
    });
  } catch (error) {
    console.error("Slack request verification failed:", error);
    return NextResponse.json(
      { error: "Invalid Slack request" },
      { status: 401 },
    );
  }

  // We don't need to handle message_deleted events
  if (event?.type === "message_deleted") {
    return NextResponse.json({
      success: true,
    });
  }

  const supabase = createClient({ admin: true });

  const { data } = await supabase
    .from("apps")
    .select("team_id, config")
    .eq("app_id", config.id)
    .eq("config->>team_id", team_id)
    .single();

  if (!data) {
    return NextResponse.json(
      { error: "Unauthorized: No matching team found" },
      { status: 401 },
    );
  }

  if (event) {
    await handleSlackEvent(event, {
      token: data?.config.access_token,
      teamId: data.team_id,
    });
  }

  return NextResponse.json({
    success: true,
  });
}
