# Meme Generator (Next.js + InstantDB)

This project is now a full-stack meme app with:
- meme editor (canvas + draggable text blocks),
- InstantDB magic-code auth,
- community feed with real-time updates,
- one-upvote-per-user toggle behavior.

## Stack
- Next.js App Router
- React + TypeScript
- InstantDB (`@instantdb/react`)

## Local Development
1. Install dependencies:
   - `npm install`
2. Start dev server:
   - `npm run dev`
3. Open:
   - `http://localhost:3000`

## Configuration
`lib/instant.ts` currently includes a fallback app ID:
- `e7205fc9-6be1-415f-b6e1-1fe55e827147`

When you are ready, switch to env-based config by adding:
- `NEXT_PUBLIC_INSTANT_APP_ID=your-app-id`

## Template Images
- Built-in templates are served from `public/templates/`.
- Current default files:
  - `public/templates/drake.jpg`
  - `public/templates/thinking.jpg`
  - `public/templates/two-buttons.jpg`
- If you rename/replace files, update template paths in `components/MemeEditor.tsx`.

## Validation and Guardrails
- Upload validation: image only, max 8MB (`lib/validators.ts`).
- Caption validation: max 140 chars.
- Basic in-memory rate limiting via Next route handler (`app/api/rate-limit/route.ts`):
  - posts: 5/minute per user,
  - votes: 20/minute per user.

## Manual Test Checklist
- Sign in with email magic code.
- Upload/select template, add text, and download meme.
- Post meme and confirm it appears in feed.
- Upvote/unvote meme and verify count changes.
- Open two browser sessions with different users and verify real-time updates.
