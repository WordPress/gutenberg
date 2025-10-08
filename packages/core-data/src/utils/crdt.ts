/**
 * WordPress dependencies
 */
import {
	type CRDTDoc,
	CRDT_RECORD_MAP_KEY,
	type ObjectData,
} from '@wordpress/sync';

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
