/**
 * Utilities for mapping between persisted (server) IDs and local staged IDs.
 */

/**
 * Returns the local staged ID for a persisted ID.
 *
 * @param {Object<string|number,string>|undefined} persistedIdMap Map of persisted IDs to local IDs.
 * @param {string|number}                          persistedId    Persisted record ID.
 * @return {string|undefined} Local staged ID, if present.
 */
export function getLocalIdForPersistedId( persistedIdMap, persistedId ) {
	return persistedIdMap?.[ persistedId ];
}

/**
 * Returns the persisted ID for a local staged ID.
 *
 * @param {Object<string|number,string>|undefined} persistedIdMap Map of persisted IDs to local IDs.
 * @param {string}                                 localId        Local staged ID.
 * @return {string|undefined} Persisted ID, if present.
 */
export function getPersistedIdForLocalId( persistedIdMap, localId ) {
	if ( ! persistedIdMap ) {
		return undefined;
	}

	for ( const [ persistedId, mappedLocalId ] of Object.entries(
		persistedIdMap
	) ) {
		if ( mappedLocalId === localId ) {
			return persistedId;
		}
	}

	return undefined;
}

/**
 * Creates a lookup map from local staged IDs to persisted IDs.
 *
 * @param {Object<string|number,string>|undefined} persistedIdMap Map of persisted IDs to local IDs.
 * @return {Map<string,string|number>} Lookup map keyed by local ID.
 */
export function createPersistedIdLookup( persistedIdMap ) {
	if ( ! persistedIdMap ) {
		return new Map();
	}

	return new Map(
		Object.entries( persistedIdMap ).map( ( [ persistedId, localId ] ) => [
			localId,
			persistedId,
		] )
	);
}

/**
 * Maps persisted record IDs to local staged IDs, preserving the persisted ID.
 *
 * @param {Object|Object[]}                        records        Record or records to map.
 * @param {Object<string|number,string>|undefined} persistedIdMap Map of persisted IDs to local IDs.
 * @param {string}                                 entityIdKey    Record ID field key.
 * @return {Object|Object[]} Mapped record(s).
 */
export function mapRecordsToLocalIds( records, persistedIdMap, entityIdKey ) {
	if ( ! persistedIdMap || Object.keys( persistedIdMap ).length === 0 ) {
		return records;
	}

	const mapRecord = ( record ) => {
		const persistedId = record?.[ entityIdKey ];
		const localId = getLocalIdForPersistedId( persistedIdMap, persistedId );
		if ( ! localId ) {
			return record;
		}

		return {
			...record,
			[ entityIdKey ]: localId,
			__unstablePersistedId: persistedId,
		};
	};

	if ( Array.isArray( records ) ) {
		let hasChanges = false;
		const mappedRecords = records.map( ( record ) => {
			const mappedRecord = mapRecord( record );
			if ( mappedRecord !== record ) {
				hasChanges = true;
			}
			return mappedRecord;
		} );

		return hasChanges ? mappedRecords : records;
	}

	return mapRecord( records );
}

/**
 * Maps an array of persisted IDs to local staged IDs, preserving order.
 *
 * @param {Array<string|number>|undefined|null}    ids            Persisted IDs to map.
 * @param {Object<string|number,string>|undefined} persistedIdMap Map of persisted IDs to local IDs.
 * @return {Array<string|number>|null} Mapped IDs or null if input isn't an array.
 */
export function mapPersistedIdsToLocalIds( ids, persistedIdMap ) {
	if ( ! Array.isArray( ids ) ) {
		return null;
	}
	if ( ! persistedIdMap || Object.keys( persistedIdMap ).length === 0 ) {
		return ids;
	}

	let hasChanges = false;
	const mappedIds = ids.map( ( id ) => {
		const localId = getLocalIdForPersistedId( persistedIdMap, id ) || id;
		if ( localId !== id ) {
			hasChanges = true;
		}
		return localId;
	} );

	return hasChanges ? mappedIds : ids;
}
