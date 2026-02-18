import { execFile } from "node:child_process";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function extractFrame(hlsUrl: string): Promise<Buffer> {
  const outPath = join(tmpdir(), `pier-cam-${Date.now()}.jpg`);

  await new Promise<void>((resolve, reject) => {
    execFile(
      "ffmpeg",
      [
        "-y",
        "-i", hlsUrl,
        "-frames:v", "1",
        "-f", "image2",
        outPath,
      ],
      { timeout: 30_000 },
      (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(`ffmpeg failed: ${error.message}\n${stderr}`));
        } else {
          resolve();
        }
      }
    );
  });

  const buffer = await readFile(outPath);
  await unlink(outPath).catch(() => {});
  return buffer;
}
