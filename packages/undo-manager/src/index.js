/**
 * WordPress dependencies
 */
import isShallowEqual from '@wordpress/is-shallow-equal';

/** @typedef {import('./types').HistoryRecord}  HistoryRecord */
/** @typedef {import('./types').HistoryChange}  HistoryChange */
/** @typedef {import('./types').HistoryChanges} HistoryChanges */
/** @typedef {import('./types').UndoManager} UndoManager */

/**
 * Merge changes for a single item into a record of changes.
 *
 * @param {Record< string, HistoryChange >} changes1 Previous changes
 * @param {Record< string, HistoryChange >} changes2 NextChanges
 *
 * @return {Record< string, HistoryChange >} Merged changes
 */
function mergeHistoryChanges( changes1, changes2 ) {
	/**
	 * @type {Record< string, HistoryChange >}
	 */
	const newChanges = { ...changes1 };
	Object.entries( changes2 ).forEach( ( [ key, value ] ) => {
		if ( newChanges[ key ] ) {
			newChanges[ key ] = { ...newChanges[ key ], to: value.to };
		} else {
			newChanges[ key ] = value;
		}
	} );

	return newChanges;
}

/**
 * Adds history changes for a single item into a record of changes.
 *
 * @param {HistoryRecord}  record  The record to merge into.
 * @param {HistoryChanges} changes The changes to merge.
 */
const addHistoryChangesIntoRecord = ( record, changes ) => {
	const existingChangesIndex = record?.findIndex(
		( { id: recordIdentifier } ) => {
			return typeof recordIdentifier === 'string'
				? recordIdentifier === changes.id
				: isShallowEqual( recordIdentifier, changes.id );
		}
	);
	const nextRecord = [ ...record ];

	if ( existingChangesIndex !== -1 ) {
		// If the edit is already in the stack leave the initial "from" value.
		nextRecord[ existingChangesIndex ] = {
			id: changes.id,
			changes: mergeHistoryChanges(
				nextRecord[ existingChangesIndex ].changes,
				changes.changes
			),
		};
	} else {
		nextRecord.push( changes );
	}
	return nextRecord;
};

/**
 * Creates an undo manager.
 *
 * @return {UndoManager} Undo manager.
 */
export function createUndoManager() {
	/**
	 * @type {HistoryRecord[]}
	 */
	let history = [];
	/**
	 * @type {HistoryRecord}
	 */
	let cachedRecord = [];
	/**
	 * @type {number}
	 */
	let offset = 0;

	const dropPendingRedos = () => {
		history = history.slice( 0, offset || undefined );
		offset = 0;
	};

	const appendCachedRecordToLatestHistoryRecord = () => {
		const index = history.length === 0 ? 0 : history.length - 1;
		let latestRecord = history[ index ] ?? [];
		cachedRecord.forEach( ( changes ) => {
			latestRecord = addHistoryChangesIntoRecord( latestRecord, changes );
		} );
		cachedRecord = [];
		history[ index ] = latestRecord;
	};

	return {
		/**
		 * Record changes into the stiory.
		 *
		 * @param {HistoryRecord=} record   A record of changes to record.
		 * @param {boolean}        isCached Whether to immediately create an undo point or not.
		 */
		record( record, isCached = false ) {
			const isEmpty = ! record || ! record.length;
			if ( isCached ) {
				if ( isEmpty ) {
					return;
				}
				record.forEach( ( changes ) => {
					cachedRecord = addHistoryChangesIntoRecord(
						cachedRecord,
						changes
					);
				} );
			} else {
				dropPendingRedos();
				if ( cachedRecord.length ) {
					appendCachedRecordToLatestHistoryRecord();
				}
				if ( isEmpty ) {
					return;
				}
				history.push( record );
			}
		},

		undo() {
			if ( cachedRecord.length ) {
				dropPendingRedos();
				appendCachedRecordToLatestHistoryRecord();
			}
			offset -= 1;
		},

		redo() {
			offset += 1;
		},

		getUndoRecord() {
			return history[ history.length - 1 + offset ];
		},

		getRedoRecord() {
			return history[ history.length + offset ];
		},
	};
}
