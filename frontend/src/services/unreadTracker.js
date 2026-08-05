// Helper utility to track opened/read connection messages across VentureIQ

const OPENED_KEY = 'ventureiq_opened_meetings';

/**
 * Returns a Set of string IDs for meetings/messages that the user has opened/read.
 */
export function getOpenedMeetingIds() {
  try {
    const raw = localStorage.getItem(OPENED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Checks if a specific meeting/message ID has been opened by the user.
 */
export function isMeetingOpened(meetingId) {
  if (!meetingId) return true;
  const opened = getOpenedMeetingIds();
  return opened.has(String(meetingId));
}

/**
 * Marks a specific meeting/message ID as opened/read, and emits a custom event.
 */
export function markMeetingAsOpened(meetingId) {
  if (!meetingId) return;
  try {
    const opened = getOpenedMeetingIds();
    const strId = String(meetingId);
    if (!opened.has(strId)) {
      opened.add(strId);
      localStorage.setItem(OPENED_KEY, JSON.stringify(Array.from(opened)));
      window.dispatchEvent(new Event('ventureiq_opened_meetings_changed'));
    }
  } catch (e) {
    console.error('Failed to mark meeting as opened:', e);
  }
}

/**
 * Marks multiple meeting IDs as opened/read.
 */
export function markAllMeetingsAsOpened(meetingIds) {
  if (!Array.isArray(meetingIds) || meetingIds.length === 0) return;
  try {
    const opened = getOpenedMeetingIds();
    let changed = false;
    meetingIds.forEach(id => {
      if (id) {
        const strId = String(id);
        if (!opened.has(strId)) {
          opened.add(strId);
          changed = true;
        }
      }
    });
    if (changed) {
      localStorage.setItem(OPENED_KEY, JSON.stringify(Array.from(opened)));
      window.dispatchEvent(new Event('ventureiq_opened_meetings_changed'));
    }
  } catch (e) {
    console.error('Failed to mark meetings as opened:', e);
  }
}
