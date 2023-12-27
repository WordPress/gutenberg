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
	let stagedRecord = [];
	/**
	 * @type {number}
	 */
	let offset = 0;

	const dropPendingRedos = () => {
		history = history.slice( 0, offset || undefined );
		offset = 0;
	};

	const appendStagedRecordToLatestHistoryRecord = () => {
		const index = history.length === 0 ? 0 : history.length - 1;
		let latestRecord = history[ index ] ?? [];
		stagedRecord.forEach( ( changes ) => {
			latestRecord = addHistoryChangesIntoRecord( latestRecord, changes );
		} );
		stagedRecord = [];
		history[ index ] = latestRecord;
	};

	/**
	 * Checks whether a record is empty.
	 * A record is considered empty if it the changes keep the same values.
	 * Also updates to function values are ignored.
	 *
	 * @param {HistoryRecord} record
	 * @return {boolean} Whether the record is empty.
	 */
	const isRecordEmpty = ( record ) => {
		const filteredRecord = record.filter( ( { changes } ) => {
			return Object.values( changes ).some(
				( { from, to } ) =>
					typeof from !== 'function' &&
					typeof to !== 'function' &&
					! isShallowEqual( from, to )
			);
		} );
		return ! filteredRecord.length;
	};

	return {
		/**
		 * Record changes into the history.
		 *
		 * @param {HistoryRecord=} record   A record of changes to record.
		 * @param {boolean}        isStaged Whether to immediately create an undo point or not.
		 */
		addRecord( record, isStaged = false ) {
			const isEmpty = ! record || isRecordEmpty( record );
			if ( isStaged ) {
				if ( isEmpty ) {
					return;
				}
				record.forEach( ( changes ) => {
					stagedRecord = addHistoryChangesIntoRecord(
						stagedRecord,
						changes
					);
				} );
			} else {
				dropPendingRedos();
				if ( stagedRecord.length ) {
					appendStagedRecordToLatestHistoryRecord();
				}
				if ( isEmpty ) {
					return;
				}
				history.push( record );
			}
		},

		undo() {
			if ( stagedRecord.length ) {
				dropPendingRedos();
				appendStagedRecordToLatestHistoryRecord();
			}
			const undoRecord = history[ history.length - 1 + offset ];
			if ( ! undoRecord ) {
				return;
			}
			offset -= 1;
			return undoRecord;
		},

		redo() {
			const redoRecord = history[ history.length + offset ];
			if ( ! redoRecord ) {
				return;
			}
			offset += 1;
			return redoRecord;
		},

		hasUndo() {
			return !! history[ history.length - 1 + offset ];
		},

		hasRedo() {
			return !! history[ history.length + offset ];
		},
	};
}
