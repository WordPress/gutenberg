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
