/**
 * WordPress dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

/**
 * A minimal no-op replacement used when the real-time collaboration package is
 * excluded from WordPress Core builds. The Yjs constructors are present only
 * to preserve the import and instanceof shape; createSyncManager() below
 * returns undefined, so these should not be reached.
 */
export const Y = {
	Doc: class {},
	Map: class {},
	Array: class {},
	Text: class {},
	createAbsolutePositionFromRelativePosition: () => null,
	createRelativePositionFromTypeIndex: () => null,
	compareRelativePositions: ( a: unknown, b: unknown ) => a === b,
};

export const YJS_VERSION = '13';

export class Awareness {
	getStates() {
		return new globalThis.Map();
	}

	getLocalState() {
		return null;
	}

	setLocalStateField() {
		return undefined;
	}

	on() {
		return undefined;
	}

	off() {
		return undefined;
	}

	destroy() {
		return undefined;
	}
}

class Delta {
	public ops: unknown[];

	constructor( ops: unknown[] = [] ) {
		this.ops = ops;
	}

	diffWithCursor() {
		return { ops: [] };
	}
}

const { lock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/sync'
);

export const privateApis = {};

lock( privateApis, {
	ConnectionErrorCode: {
		AUTHENTICATION_FAILED: 'authentication-failed',
		CONNECTION_EXPIRED: 'connection-expired',
		CONNECTION_LIMIT_EXCEEDED: 'connection-limit-exceeded',
		DOCUMENT_SIZE_LIMIT_EXCEEDED: 'document-size-limit-exceeded',
		UNKNOWN_ERROR: 'unknown-error',
	},
	createSyncManager: () => undefined,
	Delta,
	CRDT_DOC_META_PERSISTENCE_KEY: '',
	CRDT_RECORD_MAP_KEY: '',
	LOCAL_EDITOR_ORIGIN: '',
	LOCAL_UNDO_IGNORED_ORIGIN: '',
	retrySyncConnection: () => undefined,
} );
