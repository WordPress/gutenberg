export const ConnectionErrorCode = {
	AUTHENTICATION_FAILED: 'authentication-failed',
	CONNECTION_EXPIRED: 'connection-expired',
	CONNECTION_LIMIT_EXCEEDED: 'connection-limit-exceeded',
	DOCUMENT_SIZE_LIMIT_EXCEEDED: 'document-size-limit-exceeded',
	UNKNOWN_ERROR: 'unknown-error',
};

export class Delta {
	private delta: unknown;

	constructor( delta?: unknown ) {
		this.delta = delta;
	}

	diffWithCursor( other?: Delta, cursorPosition?: unknown ) {
		void other;
		void cursorPosition;
		void this.delta;
		return { ops: [] };
	}
}
export const CRDT_DOC_META_PERSISTENCE_KEY = 'fromPersistence';
export const CRDT_RECORD_MAP_KEY = 'document';
export const LOCAL_EDITOR_ORIGIN = 'gutenberg';
export const LOCAL_UNDO_IGNORED_ORIGIN = 'gutenberg-undo-ignored';
export const retrySyncConnection = () => {};

interface SyncManager {
	undoManager?: unknown;
	getAwareness?: < T >( objectType: string, objectId: string ) => T;
}

export function getSyncManager(): SyncManager | undefined {
	return undefined;
}
