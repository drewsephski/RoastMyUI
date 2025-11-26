# Roast My UI - Chrome Extension

This extension allows you to roast any website you are currently visiting using the "Roast My UI" AI.

## Installation

1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" in the top right corner.
3. Click "Load unpacked".
4. Select the `chrome-extension` folder in this project.

## Usage

1. Click the extension icon in your browser toolbar.
2. Click "Roast This Page".
3. Wait for the roast!

## Configuration

By default, the extension connects to `http://localhost:3000/api/roast`.
If you deploy the Next.js app, you need to update the `API_URL` in `popup.js` to your production URL.
