/**
 * External dependencies
 */
import * as Y from 'yjs';
import * as buffer from 'lib0/buffer';

/**
 * Internal dependencies
 */
import {
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_DOC_VERSION,
	CRDT_RECORD_METADATA_MAP_KEY as RECORD_METADATA_KEY,
	CRDT_RECORD_METADATA_SAVED_AT_KEY as SAVED_AT_KEY,
	CRDT_RECORD_METADATA_SAVED_BY_KEY as SAVED_BY_KEY,
	CRDT_STATE_MAP_KEY,
	CRDT_STATE_VERSION_KEY,
} from './config';
import type { CRDTDoc } from './types';

// An object representation of CRDT document metadata.
type DocumentMeta = Record< string, DocumentMetaValue >;
type DocumentMetaValue = boolean | number | string;

export function createYjsDoc( documentMeta: DocumentMeta = {} ): Y.Doc {
	// Convert the object representation of CRDT document metadata to a map.
	// Document metadata is passed to the Y.Doc constructor and stored in its
	// `meta` property. It is not synced to peers or persisted with the document.
	// It is just a place to store transient information about this doc instance.
	const metaMap = new Map< string, DocumentMetaValue >(
		Object.entries( documentMeta )
	);

	const ydoc = new Y.Doc( { meta: metaMap } );
	const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );

	stateMap.set( CRDT_STATE_VERSION_KEY, CRDT_DOC_VERSION );

	return ydoc;
}

/**
 * Record that the entity was saved (persisted to the database) in the CRDT
 * document record metadata.
 *
 * @param {CRDTDoc} ydoc CRDT document.
 */
export function markEntityAsSaved( ydoc: CRDTDoc ): void {
	const recordMeta = ydoc.getMap( RECORD_METADATA_KEY );
	recordMeta.set( SAVED_AT_KEY, Date.now() );
	recordMeta.set( SAVED_BY_KEY, ydoc.clientID );
}

export function serializeCrdtDoc( crdtDoc: CRDTDoc ): string {
	return JSON.stringify( {
		document: buffer.toBase64( Y.encodeStateAsUpdateV2( crdtDoc ) ),
	} );
}

export function deserializeCrdtDoc(
	serializedCrdtDoc: string
): CRDTDoc | null {
	try {
		const { document } = JSON.parse( serializedCrdtDoc );

		// Mark this document as from persistence.
		const docMeta: DocumentMeta = {
			[ CRDT_DOC_META_PERSISTENCE_KEY ]: true,
		};

		// Apply the document as an update against a new (temporary) Y.Doc.
		const ydoc = createYjsDoc( docMeta );
		const yupdate = buffer.fromBase64( document );
		Y.applyUpdateV2( ydoc, yupdate );

		// Overwrite the client ID (which is from a previous session) with a random
		// client ID. Deserialized documents should not be used directly. Instead,
		// their state should be applied to another in-use document.
		ydoc.clientID = Math.floor( Math.random() * 1000000000 );

		return ydoc;
	} catch ( e ) {
		return null;
	}
}

export function getRecordValue< RecordType, Key extends keyof RecordType >(
	obj: unknown,
	key: Key
): RecordType[ Key ] | null {
	if ( 'object' === typeof obj && null !== obj && key in obj ) {
		return ( obj as RecordType )[ key ];
	}

	return null;
}

export function getTypedKeys< T extends object >( obj: T ): Array< keyof T > {
	return Object.keys( obj ) as Array< keyof T >;
}

export function areMapsEqual< Key, Value >(
	map1: Map< Key, Value >,
	map2: Map< Key, Value >,
	comparatorFn: ( value1: Value, value2: Value ) => boolean
): boolean {
	if ( map1.size !== map2.size ) {
		return false;
	}

	for ( const [ key, value1 ] of map1.entries() ) {
		if ( ! map2.has( key ) ) {
			return false;
		}

		if ( ! comparatorFn( value1, map2.get( key )! ) ) {
			return false;
		}
	}

	return true;
}
