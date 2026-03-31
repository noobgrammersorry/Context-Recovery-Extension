# Context Recovery Extension 

A Plasmo + TypeScript browser extension that tracks tab activity, groups events into sessions, detects interrupted work, and helps you resume context effortlessly.

## Features

- **Activity Tracking**: Monitors tab open/close, updates, switches, and window focus changes.
- **Session Grouping**: Groups related browsing activity into work sessions based on idle timeouts.
- **Interruption Detection**: Uses heuristics (duration, URL count, revisits) to identify unfinished work.
- **Task Recovery**: Suggests interrupted tasks and offers one-click resume (reopens related tabs).
- **Privacy Controls**: Exclude specific domains, enable privacy mode (no URL logging), pause tracking anytime.
- **Activity Log**: Inspect all tracked events and sessions for debugging.

## Quick start

### Chrome / Edge development mode

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```
   The build output will be in `build/chrome-mv3-prod/`.

3. **Load in Chrome / Edge:**
   - Open `chrome://extensions/` or `edge://extensions/`
   - Toggle **Developer mode** (top right)
   - Click **Load unpacked**
   - Select the `build/chrome-mv3-prod/` folder
   - The extension should appear in your extensions list

4. **Open the side panel:**
   - Click the Context Recovery extension icon in the toolbar
   - A side panel opens with Dashboard or Activity Log tabs
   - Or open the popup for quick access to the latest interrupted task

### Development mode (watch)

```bash
npm run dev
```

Plasmo will auto-rebuild on file changes. Reload the extension in `chrome://extensions/` to see updates.

## MVP Manual Test Checklist

Before shipping, validate these scenarios:

### ✅ Setup & Setup validation

- [ ] Extension loads in Chrome without errors (check DevTools)
- [ ] Extension loads in Edge without errors
- [ ] Popup opens when clicking the extension icon
- [ ] Side panel Dashboard opens when clicking "Open Dashboard" in popup
- [ ] Activity Log page is accessible from Dashboard nav tabs
- [ ] Settings page is accessible from options page or settings link

### ✅ Activity Tracking

- [ ] Open 3+ new tabs on different sites → check Activity Log, see "tab_open" events
- [ ] Update a tab with new content → see "tab_update" event
- [ ] Switch between two tabs → see "tab_switch" events in Activity Log
- [ ] Close a tab → see "tab_close" event
- [ ] Minimize browser window or focus another app → see "window_blur" event
- [ ] Refocus browser → see "window_focus" event

**Check:** All events show correct URL, domain, timestamp, and event type.

### ✅ Session Grouping

- [ ] Open tabs on example.com, github.com, google.com, then stay idle for 6+ minutes
- [ ] In Activity Log, check "Work Sessions" section
- [ ] You should see one session with status "idle", containing all 3 domains and URLs
- [ ] Check "URLs" count (should be 3), "Tab switches", "Revisits"

**Check:** Sessions group related activity and close on idle timeout (default 5 minutes).

### ✅ Domain Filtering & Excluded Sites

- [ ] Go to Settings → add "twitter.com" to "Sites to skip"
- [ ] Open a Twitter tab
- [ ] In Activity Log, no new "tab_open" event should appear for twitter.com
- [ ] Open a GitHub tab → should still track this normally
- [ ] Remove twitter.com from excluded list, reload→ Twitter tabs should track again

**Check:** Excluded domains are genuinely skipped from tracking.

### ✅ Privacy Mode

- [ ] Open Settings → enable "Privacy mode"
- [ ] Open tabs on multiple sites
- [ ] In Activity Log, view events → URLs should be empty (""), titles should say "Private tab"
- [ ] Disable privacy mode → URLs and titles should be captured again

**Check:** Privacy mode redacts sensitive info while keeping session structure.

### ✅ Interruption Detection

**Scenario A: Research workflow (should detect)**
- [ ] Open google.com, switch to github.com
- [ ] Open docs.google.com, navigate through 2-3 docs
- [ ] Switch back to github, read issue
- [ ] Don't touch anything for 7 minutes (idle timeout)
- [ ] Go to Dashboard → you should see a task candidate labeled "Interrupted research session"
- [ ] Confidence score should be visible (e.g., 0.75+)
- [ ] Reasons should include signals like "4+ unique URLs visited", "session duration 5+ minutes", and at least 2 total rule signals.

**Scenario B: Form workflow (should detect)**
- [ ] Open a form on example.com, fill in text fields
- [ ] Don't interact for 7 minutes
- [ ] Go to Dashboard → check if task is suggested (this depends on form detection)

**Scenario C: Brief random browsing (should NOT detect)**
- [ ] Quickly open 2 random news articles, skim, close tabs
- [ ] Total time < 1 minute
- [ ] Idle out
- [ ] Go to Dashboard → no task should appear (too short, too few URLs)

**Check**: Detection rules avoid false positives on quick browsing but catch actual interrupted work.

### ✅ Resume Action

- [ ] In Dashboard, when a task is shown with related domains/URLs
- [ ] Click "Open again" button
- [ ] Verify that all related tabs reopen in the same window
- [ ] The primary/first URL should be the active tab
- [ ] The task should now show status "done" (or disappear from open tasks)

**Check:** Resume correctly reopens tabs and updates task state.

### ✅ Task Lifecycle

- [ ] With an open task candidate visible:
  - [ ] Click "Remind later" → task disappears from list, goes to "snoozed" state
  - [ ] Click "Dismiss" → task disappears, goes to "dismissed" state
  - [ ] Click "Done" → task disappears, goes to "done" state
  - [ ] None of these should throw errors

**Check:** Task state transitions work smoothly.

### ✅ Pause Tracking

- [ ] Open popup → click "Pause Tracking"
- [ ] Open new tabs → no new events should be logged
- [ ] In Activity Log, timestamps should freeze
- [ ] Re-enable tracking in popup → tabs should track again
- [ ] Refresh the extension/reload → pause state should persist (setting was saved)

**Check:** Pause toggle persists and genuinely halts tracking.

### ✅ Clear Local History

- [ ] Open Settings → click "Clear local history"
- [ ] Confirm the action succeeds (see success message)
- [ ] Open Activity Log → all events and sessions should be gone
- [ ] Dashboard should show "All caught up" empty state

**Check:** Data wipe is complete and doesn't crash the extension.

### ✅ Settings Persistence

- [ ] Change idle timeout from 5 to 10 minutes → Save
- [ ] Reload the extension (F5 on options page)
- [ ] Check the value is still 10 ✓
- [ ] Add "facebook.com" to excluded domains → Save
- [ ] Reload → domain should still be excluded ✓
- [ ] Toggle privacy mode on → Save
- [ ] Reload → should still be on ✓

**Check:** All settings survive reload.

### ✅ Time Filters (Activity Log)

- [ ] Open Activity Log → click "Time Filters" popup
- [ ] Select "Last 1 hour" → list updates to show only 1h of activity
- [ ] Select "Last 24 hours" → list updates ✓
- [ ] Change "Day" to "Today" → filters to current day ✓
- [ ] Pick a custom date from yesterday → only yesterday's events show ✓
- [ ] Combine "Last 6 hours" + "Today" → intersection filters correctly ✓

**Check:** Time filters work together and update the UI without errors.

### ✅ Dark Mode

- [ ] Open Dashboard → click moon/sun icon in header
- [ ] UI switches to dark theme
- [ ] Click again → switches back to light
- [ ] Reload page → mode should persist
- [ ] Open Activity Log → dark mode persists across tabs ✓

**Check:** Dark mode toggle and persistence works.

## Debugging Guide

### View Extension Logs

1. Open `chrome://extensions/`
2. Find "Context Recovery" and click **Details**
3. Click **Inspect views: service worker** to open DevTools for background script
4. Open **Console** tab to see background logs
5. Content script logs require inspecting a page where the extension runs

### Check IndexedDB State

1. Open DevTools on any page (F12)
2. Go to **Application** → **IndexedDB** → **contextRecoveryDb**
3. Inspect `events`, `sessions`, `taskCandidates`, `settings` stores
4. Check data is being saved correctly

### Manual Testing Logs

Print this checklist result + any false positives/issues found to inform post-MVP tuning.

## Architecture

- **background/**: Tab tracking, session management, interruption detection, message handlers
- **content/**: Form signal detection for unfinished form workflows
- **lib/**: Core logic (storage, models, rules, scoring, labeling)
- **ui/**: React components (Dashboard, ActivityLog, Settings, popup)
- **store/**: Zustand state management
- **types/**: TypeScript message/event definitions

## Known Limitations (MVP)

- **Interruption rules are basic**: Currently uses URL count + duration + revisits. Does not detect:
  - Intentional task switches (false positives possible)
  - Passive browsing that looks like work (e.g., long documents)
  - Form abandonment without explicit tracking integration
  
- **No cloud sync**: All data is local-only. Clearing browser data clears history.

- **Browser detection**: Always shows "Chrome" because extension only runs in Chrome-based browsers (Chromium/Edge).

## Future Enhancements

- [ ] Cross-device sync (optional cloud backend)
- [ ] Per-domain interruption rules (e.g., GitHub issues are not "interrupted")
- [ ] Form auto-save detection (no extension needed, just detect changes)
- [ ] Integration with calendar/task managers
- [ ] ML-based interruption scoring

