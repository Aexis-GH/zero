# Aexis Zero

A cross-platform interactive CLI for scaffolding minimal Next.js and Expo apps with a terminal-first UI.

## Install (global)

```sh
npm install -g @aex.is/zero
```

## Install (Homebrew)

```sh
brew install aexis-gh/homebrew-zero/zero
```

## Usage

```sh
zero
```

## Requirements

- One package manager installed: npm, pnpm, yarn, or bun.

## Generated starters

- Next.js App Router + Tailwind + shadcn-ready config.
- Expo Router + Tamagui.
- Minimal layout, four routes, metadata, and icon generation.
- Contact form wired to `/api/contact` (Next) and a device POST to your backend (Expo).

## Environment variables

The CLI generates `.env.example` with:
- Next.js: `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`.
- Expo: `EXPO_PUBLIC_CONTACT_ENDPOINT`.
- Any selected module keys (Neon, Clerk, Payload, Stripe).

## Development

```sh
bun install
bun run dev
```

### Build requirements

- Go (for the Bubble Tea TUI binary build).
- Brand assets in `assets/`:
  - `assets/icon.svg`
  - `assets/icon.png`
  - `assets/social.png`
