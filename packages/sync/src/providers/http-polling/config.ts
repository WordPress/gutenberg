export const DEFAULT_CLIENT_LIMIT_PER_ROOM = 3;
export const MAX_ERROR_BACKOFF_IN_MS = 30 * 1000; // 30 seconds
export const MAX_UPDATE_SIZE_IN_BYTES = 1 * 1024 * 1024; // 1 MB
export const POLLING_INTERVAL_IN_MS = 1000; // 1 second or 1000 milliseconds
export const POLLING_INTERVAL_WITH_COLLABORATORS_IN_MS = 250; // 250 milliseconds
// Must be less than the server-side AWARENESS_TIMEOUT (30 s) to avoid
// false disconnects when the tab is in the background.
export const POLLING_INTERVAL_BACKGROUND_TAB_IN_MS = 25 * 1000; // 25 seconds
