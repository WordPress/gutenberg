/**
 * WordPress dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

/**
 * A minimal no-op replacement used when the real-time collaboration package is
 * excluded from WordPress Core builds.
 */

class StubDoc {
	getMap() {
		return new StubMap();
	}
}

class StubMap {
	private values = new globalThis.Map< PropertyKey, unknown >();
	public parent = null;

	constructor( entries: Iterable< [ PropertyKey, unknown ] > = [] ) {
		this.values = new globalThis.Map( entries );
	}

	get( key: PropertyKey ) {
		return this.values.get( key );
	}

	set( key: PropertyKey, value: unknown ) {
		this.values.set( key, value );
	}

	has( key: PropertyKey ) {
		return this.values.has( key );
	}

	delete( key: PropertyKey ) {
		return this.values.delete( key );
	}

	toJSON() {
		return Object.fromEntries( this.values );
	}
}

class StubArray {
	private values: unknown[] = [];
	public parent = null;

	get length() {
		return this.values.length;
	}

	get( index: number ) {
		return this.values[ index ];
	}

	insert( index: number, values: unknown[] ) {
		this.values.splice( index, 0, ...values );
	}

	delete( index: number, length = 1 ) {
		this.values.splice( index, length );
	}

	map< T >( callback: ( value: unknown, index: number ) => T ) {
		return this.values.map( callback );
	}

	forEach( callback: ( value: unknown, index: number ) => void ) {
		this.values.forEach( callback );
	}

	toArray() {
		return [ ...this.values ];
	}
}

class StubText {
	private value: string;
	public parent = null;

	constructor( value = '' ) {
		this.value = value;
	}

	insert( index: number, text: string ) {
		this.value =
			this.value.slice( 0, index ) + text + this.value.slice( index );
	}

	delete( index: number, length: number ) {
		this.value =
			this.value.slice( 0, index ) + this.value.slice( index + length );
	}

	toDelta() {
		return [];
	}

	applyDelta() {
		return undefined;
	}

	toJSON() {
		return this.value;
	}

	toString() {
		return this.value;
	}
}

export const Y = {
	Doc: StubDoc,
	Map: StubMap,
	Array: StubArray,
	Text: StubText,
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
