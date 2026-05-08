/**
 * Connection status types for the core-data store.
 *
 * These mirror the shapes previously provided by `@wordpress/sync` so that
 * consumers (e.g. the editor) can type connection UI without depending on sync.
 */

export type ConnectionErrorCode =
	| 'authentication-failed'
	| 'connection-expired'
	| 'connection-limit-exceeded'
	| 'document-size-limit-exceeded'
	| 'unknown-error';

export interface ConnectionError {
	code: ConnectionErrorCode;
	message?: string;
}

/** Error code used when a CRDT document exceeds server limits. */
export const DOCUMENT_SIZE_LIMIT_EXCEEDED_CODE: ConnectionErrorCode =
	'document-size-limit-exceeded';

export interface ConnectionStatusConnected {
	status: 'connected';
}

export interface ConnectionStatusConnecting {
	status: 'connecting';
}

export interface ConnectionStatusDisconnected {
	status: 'disconnected';
	error?: ConnectionError;
	canManuallyRetry?: boolean;
	consecutiveFailures?: number;
	backgroundRetriesFailed?: boolean;
	willAutoRetryInMs?: number;
}

export type ConnectionStatus =
	| ConnectionStatusConnected
	| ConnectionStatusConnecting
	| ConnectionStatusDisconnected;
