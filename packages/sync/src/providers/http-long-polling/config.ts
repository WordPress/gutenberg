/**
 * Internal dependencies
 *
 * The long-polling transport shares the polling transport's limits, retry
 * schedules, and background cadence so both transports behave identically
 * under error and background-tab conditions.
 */
export {
	DEFAULT_CLIENT_LIMIT_PER_ROOM,
	DISCONNECT_DIALOG_RETRY_MS,
	ERROR_RETRY_DELAYS_SOLO_MS,
	ERROR_RETRY_DELAYS_WITH_COLLABORATORS_MS,
	MANUAL_RETRY_INTERVAL_MS,
	MAX_ROOMS_PER_REQUEST,
	MAX_SYNC_REQUEST_BODY_SIZE_IN_BYTES,
	MAX_UPDATE_SIZE_IN_BYTES,
	MIN_SYNC_REQUEST_BODY_SIZE_LIMIT_IN_BYTES,
	POLLING_INTERVAL_BACKGROUND_TAB_IN_MS,
} from '../http-polling/config';

// Small coalescing window applied before aborting a held long-poll to send
// local updates. Batches rapid successive changes (e.g. typing) into a single
// request while keeping outgoing latency low.
export const SEND_DEBOUNCE_MS = 100;

// Minimum delay between long-poll requests when the previous request
// returned quickly with nothing to deliver. Guards against hot-looping on a
// misbehaving server while keeping the normal re-issue immediate.
export const MIN_REQUEST_INTERVAL_MS = 250;
