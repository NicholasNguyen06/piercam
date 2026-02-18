import Twilio from "twilio";
import type { VisibilityAssessment } from "./types.js";

function formatMessage(assessment: VisibilityAssessment): string {
  const time = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return [
    `Scripps Pier: ${assessment.rating.toUpperCase()}`,
    `~${assessment.estimatedVisibilityFt}ft vis, ${assessment.pilingCount} pilings (${assessment.visiblePilings.join(", ")})`,
    `${time} PT`,
  ].join("\n");
}

export async function sendNotifications(
  assessment: VisibilityAssessment
): Promise<number> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const phoneNumbers = process.env.NOTIFY_PHONE_NUMBERS;

  if (!accountSid || !authToken || !fromNumber || !phoneNumbers) {
    console.log("Twilio credentials not configured, skipping SMS");
    return 0;
  }

  const client = Twilio(accountSid, authToken);
  const recipients = phoneNumbers.split(",").map((n) => n.trim());
  const body = formatMessage(assessment);

  let sent = 0;
  for (const to of recipients) {
    await client.messages.create({ body, from: fromNumber, to });
    sent++;
    console.log(`SMS sent to ${to}`);
  }

  return sent;
}
