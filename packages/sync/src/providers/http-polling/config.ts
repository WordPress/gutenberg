/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

export const DEFAULT_CLIENT_LIMIT_PER_ROOM = 3;

// Retry delays after poll failures.
// The disconnect dialog shows after all retries are exhausted, then retries
// continue at DISCONNECT_DIALOG_RETRY_MS.
export const ERROR_RETRY_DELAYS_SOLO_MS = [
	2000, 4000, 8000, 12000,
	// Solo: 26s total retry time solo before dialog
];
export const ERROR_RETRY_DELAYS_WITH_COLLABORATORS_MS = [
	1000, 2000, 4000, 8000,
	// With collaborators: 15s total retry time before dialog
];

// How often to automatically retry the connection when in the disconnect dialog.
export const DISCONNECT_DIALOG_RETRY_MS = 30000;

// When a user manually retries on the disconnection dialog, the amount of time
// until the next automatic retry attempt.
export const MANUAL_RETRY_INTERVAL_MS = 15000;

export const MAX_UPDATE_SIZE_IN_BYTES = 1 * 1024 * 1024; // 1 MB

export const POLLING_INTERVAL_IN_MS = applyFilters(
	'sync.pollingManager.pollingInterval',
	4000 // 4 seconds
) as number;

export const POLLING_INTERVAL_WITH_COLLABORATORS_IN_MS = applyFilters(
	'sync.pollingManager.pollingIntervalWithCollaborators',
	1000 // 1 second
) as number;

// Must be less than the server-side AWARENESS_TIMEOUT (30 s) to avoid
// false disconnects when the tab is in the background.
export const POLLING_INTERVAL_BACKGROUND_TAB_IN_MS = 25 * 1000; // 25 seconds
