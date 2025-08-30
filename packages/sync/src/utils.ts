/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * Internal dependencies
 */
import { CRDT_DOC_VERSION } from './config';
import { type ObjectType } from './types';

export function createYjsDoc( objectType: ObjectType ): Y.Doc {
	// Meta is not synced and does not get persisted with the document.
	const meta = new Map< string, unknown >( [
		[ 'objectType', objectType ],
		[ 'version', CRDT_DOC_VERSION ],
	] );

	return new Y.Doc( { meta } );
}
