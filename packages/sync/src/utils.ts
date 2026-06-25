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
	CRDT_STATE_MAP_SAVED_AT_KEY as SAVED_AT_KEY,
	CRDT_STATE_MAP_SAVED_BY_KEY as SAVED_BY_KEY,
	CRDT_STATE_MAP_VERSION_KEY as VERSION_KEY,
} from './config';
import type { CRDTDoc, ObjectData } from './types';

// An object representation of CRDT document metadata.
type DocumentMeta = Record< string, DocumentMetaValue >;
type DocumentMetaValue = boolean | number | string;

interface SerializedCrdtDoc {
	baseVersion?: string;
	baseRecordSnapshot?: ObjectData;
	document: string;
	recordSnapshot?: ObjectData;
	updateId?: number;
	version?: string;
}

interface SerializeCrdtDocOptions {
	baseVersion?: string | null;
	baseRecordSnapshot?: ObjectData | null;
	recordSnapshot?: ObjectData | null;
}

/**
 * Creates a new Y.Doc instance with the given document metadata.
 *
 * @param {DocumentMeta} documentMeta Optional metadata to associate with the
 *                                    document. Metadata is not persisted.
 */
export function createYjsDoc( documentMeta: DocumentMeta = {} ): CRDTDoc {
	// Convert the object representation of CRDT document metadata to a map.
	// Document metadata is passed to the Y.Doc constructor and stored in its
	// `meta` property. It is not synced to peers or persisted with the document.
	// It is just a place to store transient information about this doc instance.
	const metaMap = new Map< string, DocumentMetaValue >(
		Object.entries( documentMeta )
	);

	// IMPORTANT: Do not add update the document itself to avoid generating updates
	// before observers are attached. Add initial updates in `initializeYjsDoc`.
	return new Y.Doc( { meta: metaMap } );
}

/**
 * Initializes a Y.Doc instance with the necessary CRDT state for our use case.
 *
 * @param {Y.Doc} ydoc Y.Doc instance to initialize.
 */
export function initializeYjsDoc( ydoc: CRDTDoc ): void {
	const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );
	stateMap.set( VERSION_KEY, CRDT_DOC_VERSION );
}

/**
 * Record that the entity was saved by a user-facing entity save in the CRDT
 * document metadata. Background CRDT snapshots should not update this marker.
 *
 * @param {CRDTDoc} ydoc CRDT document.
 */
export function markEntityAsSaved( ydoc: CRDTDoc ): void {
	const recordMeta = ydoc.getMap( CRDT_STATE_MAP_KEY );
	recordMeta.set( SAVED_AT_KEY, Date.now() );
	recordMeta.set( SAVED_BY_KEY, ydoc.clientID );
}

function pseudoRandomID(): number {
	return Math.floor( Math.random() * 1000000000 );
}

function toUint32Hex( value: number ): string {
	return ( value >>> 0 ).toString( 16 ).padStart( 8, '0' );
}

function getPersistedCrdtDocDocumentVersion( document: string ): string {
	let hashA = 0x811c9dc5;
	let hashB = 0x811c9dc5 ^ 0x9e3779b9;

	for ( let i = 0; i < document.length; i++ ) {
		const charCode = document.charCodeAt( i );
		hashA = Math.imul( hashA ^ charCode, 0x01000193 );
		hashB = Math.imul( hashB ^ charCode ^ ( i & 0xff ), 0x01000193 );
	}

	return `document:${ document.length }:${ toUint32Hex(
		hashA
	) }${ toUint32Hex( hashB ) }`;
}

function parseSerializedCrdtDoc(
	serializedCrdtDoc: string
): SerializedCrdtDoc | null {
	try {
		const parsed = JSON.parse( serializedCrdtDoc );

		if ( typeof parsed?.document !== 'string' ) {
			return null;
		}

		return parsed;
	} catch {
		return null;
	}
}

function isObjectData( value: unknown ): value is ObjectData {
	return (
		'object' === typeof value && null !== value && ! Array.isArray( value )
	);
}

export function getPersistedCrdtDocVersion(
	serializedCrdtDoc: string | null | undefined
): string | null {
	if ( ! serializedCrdtDoc ) {
		return null;
	}

	const parsed = parseSerializedCrdtDoc( serializedCrdtDoc );
	return parsed
		? getPersistedCrdtDocDocumentVersion( parsed.document )
		: null;
}

export function getPersistedCrdtDocRecordSnapshot(
	serializedCrdtDoc: string | null | undefined
): ObjectData | null {
	if ( ! serializedCrdtDoc ) {
		return null;
	}

	const parsed = parseSerializedCrdtDoc( serializedCrdtDoc );
	return parsed && isObjectData( parsed.recordSnapshot )
		? parsed.recordSnapshot
		: null;
}

export function getPersistedCrdtDocBaseRecordSnapshot(
	serializedCrdtDoc: string | null | undefined
): ObjectData | null {
	if ( ! serializedCrdtDoc ) {
		return null;
	}

	const parsed = parseSerializedCrdtDoc( serializedCrdtDoc );
	return parsed && isObjectData( parsed.baseRecordSnapshot )
		? parsed.baseRecordSnapshot
		: null;
}

export function serializeCrdtDoc(
	crdtDoc: CRDTDoc,
	options: SerializeCrdtDocOptions = {}
): string {
	const document = buffer.toBase64( Y.encodeStateAsUpdateV2( crdtDoc ) );
	const serialized: SerializedCrdtDoc = {
		document,
		updateId: pseudoRandomID(), // helps with debugging
		version: getPersistedCrdtDocDocumentVersion( document ),
	};

	if ( options.baseVersion ) {
		serialized.baseVersion = options.baseVersion;
	}

	if ( options.baseRecordSnapshot ) {
		serialized.baseRecordSnapshot = options.baseRecordSnapshot;
	}

	if ( options.recordSnapshot ) {
		serialized.recordSnapshot = options.recordSnapshot;
	}

	return JSON.stringify( serialized );
}

export function deserializeCrdtDoc(
	serializedCrdtDoc: string
): CRDTDoc | null {
	try {
		const parsed = parseSerializedCrdtDoc( serializedCrdtDoc );

		if ( ! parsed ) {
			return null;
		}

		const { document } = parsed;

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
		ydoc.clientID = pseudoRandomID();

		return ydoc;
	} catch {
		return null;
	}
}
