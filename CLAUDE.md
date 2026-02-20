# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

Scripps Pier underwater visibility notification service. Captures a frame from the Scripps Pier live underwater webcam, uses Claude Vision to estimate visibility by counting visible pier pilings at known distances, and emails subscribers when conditions are good for diving.

## Commands

- `npm run check` — Run the full pipeline: fetch stream → extract frame → analyze with Claude Vision → send emails if visibility meets threshold. Requires `.env` (see `.env.example`). Also requires `ffmpeg` installed locally.

## Architecture

Single pipeline orchestrated by `src/check.ts`:

1. **`stream.ts`** — Scrapes the HDOnTap embed page to extract the HLS stream URL for the Scripps Pier underwater camera
2. **`snapshot.ts`** — Uses `ffmpeg` to extract a single JPEG frame from the HLS stream
3. **`vision.ts`** — Sends the frame to Claude Sonnet (vision) with a detailed prompt about piling positions and distances; parses JSON response into a `VisibilityAssessment`
4. **`email.ts`** — Fetches subscriber list from Supabase (falls back to `NOTIFY_EMAILS` env var), sends emails via Resend
5. **`types.ts`** — Shared `VisibilityAssessment` interface

`check.ts` manually parses `.env` without a library (no dotenv dependency). Environment variables take precedence over `.env` file values.

## Subscriber Signup

`web/index.html` is a standalone static page (no build step) that uses Supabase JS client to insert emails into a `subscribers` table. Deployed to GitHub Pages via `.github/workflows/pages.yml` on pushes to `web/`.

The frontend uses the **anon key** (public); the backend (`email.ts`) uses the **service role key** to read subscribers.

## GitHub Actions

- **check-visibility.yml** — Runs the pipeline on cron (7am and 10am PT). All secrets are in GitHub Actions secrets.
- **pages.yml** — Deploys `web/` to GitHub Pages on push to main.

## Environment Variables

See `.env.example`. Key ones: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VISIBILITY_THRESHOLD_FT` (default 15).
