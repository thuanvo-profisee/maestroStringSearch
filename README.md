# Maestro Strings Search Extension

This guide explains how to load this extension into a Chromium-based browser (Chrome, Edge, Brave, Opera).

## Prerequisites

- A Chromium-based browser installed
- This project folder available locally:
  - `c:\DevOps\ext\maestroStringsSeach\maestroStringsSearch`

## Load the Extension (Unpacked)

1. Open your browser.
2. Go to the extensions page:
	- Chrome: `chrome://extensions/`
	- Edge: `edge://extensions/`
	- Brave: `brave://extensions/`
3. Enable **Developer mode** (usually a toggle in the top-right).
4. Click **Load unpacked**.
5. Select this folder:
	- `c:\DevOps\ext\maestroStringsSeach\maestroStringsSearch`
6. Confirm the extension appears in the extensions list.

## Test the Extension

1. Pin the extension from the browser toolbar (optional but useful).
2. Click the extension icon to open the popup.
3. Verify the popup UI and behavior work as expected.

## Update After Code Changes

1. Return to the extensions page.
2. Find **Maestro Strings Search Extension**.
3. Click **Reload** on the extension card.

## Troubleshooting

- If loading fails, confirm `manifest.json` is in the selected root folder.
- If the extension does not update, use **Reload** after each change.
- If popup styles/scripts are missing, verify `popup.html`, `popup.js`, and `styles.css` exist in the same folder.
