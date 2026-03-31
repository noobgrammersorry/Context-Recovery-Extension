# Context Recovery Extension

Context Recovery is a browser extension built with Plasmo + TypeScript.

Its main function is to help users resume unfinished work by:

- Tracking tab and window activity
- Grouping activity into work sessions
- Detecting likely interruptions using session signals
- Suggesting recoverable tasks in the UI
- Reopening related tabs with one click

## What It Does

The extension watches browsing behavior in Chrome-based browsers, identifies when meaningful work might have been interrupted, and surfaces recovery suggestions so users can continue where they left off.

## Core Capabilities

- Activity tracking: tab open, close, switch, update, focus, blur
- Session grouping based on idle timeout windows
- Interruption scoring based on rules like duration, revisits, and URL diversity
- Resume actions that restore relevant tabs
- Privacy controls such as skipped domains, privacy mode, and pause tracking

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Build extension:

```bash
npm run build
```

3. Load unpacked extension from:

`build/chrome-mv3-prod/`

4. Open popup or side panel to view recovery suggestions.

## Tech Stack

- Plasmo
- TypeScript
- React
- Zustand
- IndexedDB
