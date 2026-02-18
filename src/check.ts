import { readFileSync, existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";

const envPath = new URL("../.env", import.meta.url).pathname;
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

import { getHlsStreamUrl } from "./stream.js";
import { extractFrame } from "./snapshot.js";
import { analyzeVisibility } from "./vision.js";
import { sendNotifications } from "./sms.js";

const THRESHOLD_FT = Number(process.env.VISIBILITY_THRESHOLD_FT) || 15;

async function main() {
  console.log("Fetching HLS stream URL...");
  const hlsUrl = await getHlsStreamUrl();
  console.log(`Stream URL: ${hlsUrl.slice(0, 80)}...`);

  console.log("Extracting frame with ffmpeg...");
  const frame = await extractFrame(hlsUrl);
  console.log(`Frame captured: ${frame.length} bytes`);

  const framePath = new URL("../latest-frame.jpg", import.meta.url).pathname;
  await writeFile(framePath, frame);
  console.log(`Frame saved to ${framePath}`);

  console.log("Analyzing visibility with Claude Vision...");
  const assessment = await analyzeVisibility(frame);
  console.log("Assessment:", JSON.stringify(assessment, null, 2));

  if (assessment.confidence === "low") {
    console.log("Low confidence — skipping notification");
    return;
  }

  if (assessment.estimatedVisibilityFt >= THRESHOLD_FT) {
    console.log(
      `Visibility ${assessment.estimatedVisibilityFt}ft >= ${THRESHOLD_FT}ft threshold — sending notifications`
    );
    const sent = await sendNotifications(assessment);
    console.log(`Sent ${sent} notification(s)`);
  } else {
    console.log(
      `Visibility ${assessment.estimatedVisibilityFt}ft < ${THRESHOLD_FT}ft threshold — no notification`
    );
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
