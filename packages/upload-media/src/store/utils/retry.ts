/**
 * Retry utilities for upload operations.
 *
 * Provides exponential backoff calculation and error classification
 * for determining whether failed uploads should be retried.
 */

/**
 * Internal dependencies
 */
import type { QueueItemId } from '../types';

export interface RetryDelayOptions {
	/** The current retry attempt number (1-based). */
	attempt: number;
	/** Initial delay in milliseconds before the first retry. */
	initialDelay: number;
	/** Maximum delay in milliseconds (cap for exponential growth). */
	maxDelay: number;
	/** Multiplier for exponential backoff (e.g., 2 means double each time). */
	multiplier: number;
	/** Jitter factor (0-1) to add randomness to prevent thundering herd. */
	jitter: number;
}

/**
 * Calculates the delay before the next retry attempt using exponential backoff with jitter.
 *
 * The formula is: min(initialDelay * multiplier^(attempt-1), maxDelay) * (1 +/- jitter)
 *
 * @param options - Configuration for the retry delay calculation.
 * @return The delay in milliseconds before the next retry.
 *
 * @example
 * // With defaults: attempt 1 = ~1000ms, attempt 2 = ~2000ms, attempt 3 = ~4000ms
 * calculateRetryDelay({
 *   attempt: 1,
 *   initialDelay: 1000,
 *   maxDelay: 30000,
 *   multiplier: 2,
 *   jitter: 0.1,
 * });
 */
export function calculateRetryDelay( options: RetryDelayOptions ): number {
	const { attempt, initialDelay, maxDelay, multiplier, jitter } = options;

	// Calculate base exponential delay: initialDelay * multiplier^(attempt-1).
	const exponentialDelay = initialDelay * Math.pow( multiplier, attempt - 1 );

	// Cap the delay at maxDelay.
	const cappedDelay = Math.min( exponentialDelay, maxDelay );

	// Apply jitter: multiply by a random factor between (1-jitter) and (1+jitter).
	// This helps prevent multiple failed uploads from retrying at exactly the same time.
	const jitterFactor = 1 + ( Math.random() * 2 - 1 ) * jitter;

	return Math.floor( cappedDelay * jitterFactor );
}

/**
 * Patterns in error messages that indicate a transient/retryable condition.
 *
 * The upload path rejects with plain `Error` instances from `fetch` and
 * `@wordpress/api-fetch`, so message matching is the most reliable signal.
 * Covers Chrome (`Failed to fetch`), Safari (`Load failed`), Node DNS/TCP
 * failures, and the localized `apiFetch` `fetch_error` message.
 */
const RETRYABLE_MESSAGE_PATTERNS = [
	/network/i,
	/timeout/i,
	/ECONNRESET/i,
	/fetch failed/i,
	/connection/i,
	/socket/i,
	/ETIMEDOUT/i,
	/ENOTFOUND/i,
	/Could not get a valid response/i,
	/Failed to fetch/i,
	/Load failed/i,
];

/**
 * Determines whether an upload error should trigger an automatic retry.
 *
 * Returns `false` once the retry budget is exhausted, otherwise returns
 * `true` if the error message looks transient (see `RETRYABLE_MESSAGE_PATTERNS`).
 *
 * Accepts both `Error` instances and plain strings: the editor's media-upload
 * wrapper forwards only the error *message* (a string) to the queue, so the
 * upload path frequently rejects with a string rather than an `Error`.
 *
 * @param error      The error that occurred, or its message.
 * @param retryCount The number of retries already attempted.
 * @param maxRetries The maximum number of retries allowed.
 * @return Whether the error should be retried.
 */
export function shouldRetryError(
	error: Error | string,
	retryCount: number,
	maxRetries: number
): boolean {
	if ( retryCount >= maxRetries ) {
		return false;
	}

	const message = typeof error === 'string' ? error : error?.message || '';
	return RETRYABLE_MESSAGE_PATTERNS.some( ( pattern ) =>
		pattern.test( message )
	);
}

/**
 * Module-level storage for retry timer IDs.
 *
 * Timer references are kept outside Redux state because they are
 * non-serializable and only needed for cleanup on cancellation.
 */
export const retryTimers = new Map<
	QueueItemId,
	ReturnType< typeof setTimeout >
>();

/**
 * Clears any pending retry timer for the given item.
 *
 * @param id Item ID.
 */
export function clearRetryTimer( id: QueueItemId ): void {
	const pendingTimer = retryTimers.get( id );
	if ( pendingTimer !== undefined ) {
		clearTimeout( pendingTimer );
		retryTimers.delete( id );
	}
}
