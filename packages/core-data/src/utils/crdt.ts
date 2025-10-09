/**
 * WordPress dependencies
 */
import { type CRDTDoc, type ObjectData } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { CRDT_RECORD_MAP_KEY } from '../sync';

export function defaultApplyChangesToCRDTDoc(
	crdtDoc: CRDTDoc,
	changes: ObjectData
): void {
	const document = crdtDoc.getMap( CRDT_RECORD_MAP_KEY );
	Object.entries( changes ).forEach( ( [ key, value ] ) => {
		if ( document.get( key ) !== value ) {
			document.set( key, value );
		}
	} );
}

export function defaultGetChangesFromCRDTDoc( crdtDoc: CRDTDoc ): ObjectData {
	return crdtDoc.getMap( CRDT_RECORD_MAP_KEY ).toJSON();
}
