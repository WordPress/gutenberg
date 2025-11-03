/**
 * Internal dependencies
 */
import { WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE } from './config';
import type { CRDTDoc, ObjectData } from './types';
import { deserializeCrdtDoc, serializeCrdtDoc } from './utils';

export function getPersistedCrdtDoc( record: ObjectData ): CRDTDoc | null {
	const serializedCrdtDoc =
		record.meta?.[ WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE ];
	if ( serializedCrdtDoc ) {
		return deserializeCrdtDoc( serializedCrdtDoc );
	}

	return null;
}

export function createPersistedCRDTDoc(
	ydoc: CRDTDoc
): Record< string, string > {
	return {
		[ WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE ]:
			serializeCrdtDoc( ydoc ),
	};
}
