# Maestro Strings Search Extension

A Chromium extension that searches `window.maestroStrings` on the active page. Built with React, Vite, Tailwind CSS, and [shadcn/ui](https://ui.shadcn.com).

## Features

- Search by **Value**, **Key**, or **Both**.
- Press Enter or **Search** to search. Large result lists stay fast because only the visible rows are drawn.
- Copy a key with the copy button on each result.
- Export to JSON: all strings on the page, or the current results only.
- The popup keeps the last query, mode, and results after you close it.
- Follows the system light or dark theme.

## Prerequisites

- Node.js 22 or later
- A Chromium-based browser (Chrome, Edge, Brave, Opera)

## Build

```sh
npm install
npm run build
```

The build writes the extension to the `dist` folder. To rebuild on each change, run `npm run dev`.

## Load the Extension (Unpacked)

1. Go to the extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `dist` folder in this project.

## Showcase

<img src="./how-to-use.gif" width="400px" />

## Update After Code Changes

1. Run `npm run build` (or keep `npm run dev` running).
2. On the extensions page, click **Reload** on the **Maestro Strings Search** card.

## Project Structure

- `public/manifest.json`: extension manifest, copied to `dist`.
- `popup.html`: popup entry page.
- `public/icons`: extension icons.
- `src/App.tsx`: popup UI.
- `src/components/result-list.tsx`: result list that draws only the visible rows.
- `src/lib/maestro.ts`: searches `window.maestroStrings` in the page and exports it.
- `src/lib/popup-state.ts`: saves popup state in `chrome.storage.local`.
- `src/components/ui`: shadcn/ui components. Add more with `npx shadcn add <component>`.

## Troubleshooting

- If loading fails, make sure you selected `dist`, not the project root.
- If the popup shows old behavior, rebuild and click **Reload**.
- The **storage** permission is new in version 2.0. The browser can ask you to accept it after the update.
