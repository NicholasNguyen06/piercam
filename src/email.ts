import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import type { VisibilityAssessment } from "./types.js";

function formatSubject(assessment: VisibilityAssessment): string {
  return `Scripps Pier: ${assessment.rating.toUpperCase()} — ~${assessment.estimatedVisibilityFt}ft visibility`;
}

function formatBody(assessment: VisibilityAssessment): string {
  const time = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return [
    `Visibility: ~${assessment.estimatedVisibilityFt}ft (${assessment.rating})`,
    `Pilings visible: ${assessment.pilingCount} (${assessment.visiblePilings.join(", ")})`,
    `${assessment.description}`,
    `Scripps Cam: https://coollab.ucsd.edu/pierviz/`,
    ``,
    `${time} PT`,
  ].join("\n");
}

async function getRecipients(): Promise<string[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from("subscribers").select("email");

    if (error) {
      console.error("Failed to fetch subscribers from Supabase:", error.message);
    } else if (data && data.length > 0) {
      return data.map((row) => row.email);
    }
  }

  // Fall back to NOTIFY_EMAILS env var
  const emails = process.env.NOTIFY_EMAILS;
  if (emails) {
    return emails.split(",").map((e) => e.trim());
  }

  return [];
}

export async function sendNotifications(
  assessment: VisibilityAssessment
): Promise<number> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("Resend API key not configured, skipping email");
    return 0;
  }

  const recipients = await getRecipients();
  if (recipients.length === 0) {
    console.log("No subscribers found, skipping email");
    return 0;
  }

  const resend = new Resend(apiKey);
  const subject = formatSubject(assessment);
  const text = formatBody(assessment);

  let sent = 0;
  for (const to of recipients) {
    await resend.emails.send({
      from: "Pier Cam <onboarding@resend.dev>",
      to,
      subject,
      text,
    });
    sent++;
    console.log(`Email sent to ${to}`);
  }

  return sent;
}
