export enum ConnectionErrorCode {
	AUTHENTICATION_FAILED = 'authentication-failed',
	CONNECTION_EXPIRED = 'connection-expired',
	CONNECTION_LIMIT_EXCEEDED = 'connection-limit-exceeded',
	DOCUMENT_SIZE_LIMIT_EXCEEDED = 'document-size-limit-exceeded',
	UNKNOWN_ERROR = 'unknown-error',
}

export class ConnectionError extends Error {
	constructor(
		public code: ConnectionErrorCode = ConnectionErrorCode.UNKNOWN_ERROR,
		message?: string
	) {
		super( message );
		this.name = 'ConnectionError';
	}
}
