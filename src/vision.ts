import Anthropic from "@anthropic-ai/sdk";
import type { VisibilityAssessment } from "./types.js";

const SYSTEM_PROMPT = `You are an underwater visibility analyst for the Scripps Pier camera in La Jolla, CA.

The camera is mounted underwater on the pier. It sees specific pilings at known positions:

RIGHT SIDE OF FRAME:
- Right close piling: ~4ft (1.2m) from camera — always visible unless very poor conditions
- Right back piling: ~11ft (3.4m) from camera — visible in fair+ conditions

LEFT SIDE OF FRAME:
- Back left piling: ~14ft (4.3m) from camera — only visible in calm, clear water
- Far left piling: ~30ft (9m) from camera — rarely visible, exceptional conditions only

WHAT PILINGS LOOK LIKE: Pilings appear as dark vertical columns or rectangular shapes, often covered in marine growth (algae, barnacles). The closest piling will be large, dark, and sharp. Pilings further away appear as fainter, blurrier dark vertical silhouettes — they may blend into the murky background but are still countable. Do NOT mistake horizontal features (pipes, cables, the seafloor) for pilings — pilings are always vertical.

COUNTING INSTRUCTIONS: Carefully scan the entire frame from right to left. You should expect to see up to 4 pilings at different distances. Pilings further from the camera will appear smaller, fainter, and more blurred, but a faint/hazy piling still counts — it proves visibility extends to at least that distance. Count every distinct dark vertical shape that could be a piling, even if it is partially obscured or blurry.

HARD CONSTRAINT: Your visibility estimate MUST NOT exceed the distance of the farthest piling you can clearly see. If you only see the 2 right-side pilings, visibility cannot exceed ~14ft. If you cannot see the back left piling, do not estimate above 14ft.

Visibility rating scale:
- "poor": 0–4ft (can't even see the closest right piling clearly, or no pilings visible)
- "fair": 4–11ft (right close piling visible, right back piling faint or invisible)
- "good": 11–14ft (both right pilings clearly visible, back left piling may be faintly visible)
- "excellent": 14–30ft (back left piling clearly visible; if far left piling visible, exceptional)

Confidence levels:
- "high": Clear daytime image, pilings are visible and countable
- "medium": Image is somewhat murky but pilings are partially distinguishable
- "low": Nighttime, camera offline, error overlay, completely dark, or cannot determine conditions

Respond ONLY with valid JSON matching this schema:
{
  "description": "Brief description of what you see in the image",
  "pilingCount": <number of clearly visible pilings, 0 if none>,
  "visiblePilings": <subset of ["close R", "back R", "back L", "far L"] that are visible>,
  "estimatedVisibilityFt": <estimated visibility in feet>,
  "rating": "poor" | "fair" | "good" | "excellent",
  "confidence": "low" | "medium" | "high"
}`;

const USER_PROMPT = `Analyze this Scripps Pier underwater camera frame. Count how many pier pilings you can see, estimate the underwater visibility distance in feet, and rate the conditions. Respond with JSON only.`;

export async function analyzeVisibility(
  imageBuffer: Buffer
): Promise<VisibilityAssessment> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageBuffer.toString("base64"),
            },
          },
          { type: "text", text: USER_PROMPT },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse vision response: ${text}`);
  }

  return JSON.parse(jsonMatch[0]) as VisibilityAssessment;
}
