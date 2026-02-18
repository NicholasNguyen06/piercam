const EMBED_URL =
  "https://hdontap.com/stream/018408/scripps-pier-underwater-live-webcam/embed/";

export async function getHlsStreamUrl(): Promise<string> {
  const res = await fetch(EMBED_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch embed page: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();

  // The stream URL is in a JSON script tag: <script id="player-data" type="application/json">
  const jsonMatch = html.match(
    /<script\s+id="player-data"\s+type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!jsonMatch) {
    throw new Error("Could not find player-data script tag in embed page");
  }

  const playerData = JSON.parse(jsonMatch[1]);
  const streamSrc: string = playerData.streamSrc;
  if (!streamSrc || !streamSrc.includes("playlist.m3u8")) {
    throw new Error("Could not find streamSrc in player data");
  }

  return streamSrc;
}
