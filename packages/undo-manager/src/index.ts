/**
 * WordPress dependencies
 */
import { isShallowEqual } from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import type {
	HistoryChange as _HistoryChange,
	HistoryChanges as _HistoryChanges,
	HistoryRecord as _HistoryRecord,
	UndoManager as _UndoManager,
} from './types';

/**
 * Represents a single change in history.
 */
export type HistoryChange< T = unknown > = _HistoryChange< T >;

/**
 * Represents changes for a single item.
 */
export type HistoryChanges< T = unknown > = _HistoryChanges< T >;

/**
 * Represents a record of history changes.
 */
export type HistoryRecord< T = unknown > = _HistoryRecord< T >;

/**
 * The undo manager interface.
 */
export type UndoManager< T = unknown > = _UndoManager< T >;

/**
 * Merge changes for a single item into a record of changes.
 *
 * @param changes1 Previous changes
 * @param changes2 Next changes
 *
 * @return Merged changes
 */
function mergeHistoryChanges< T >(
	changes1: Record< string, HistoryChange< T > >,
	changes2: Record< string, HistoryChange< T > >
): Record< string, HistoryChange< T > > {
	const newChanges: Record< string, HistoryChange< T > > = { ...changes1 };
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
 * @param record  The record to merge into.
 * @param changes The changes to merge.
 */
const addHistoryChangesIntoRecord = < T >(
	record: HistoryRecord< T >,
	changes: HistoryChanges< T >
): HistoryRecord< T > => {
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
 * @return Undo manager.
 */
export function createUndoManager< T = unknown >(): UndoManager< T > {
	let history: HistoryRecord< T >[] = [];
	let stagedRecord: HistoryRecord< T > = [];
	let offset = 0;

	const dropPendingRedos = (): void => {
		history = history.slice( 0, offset || undefined );
		offset = 0;
	};

	const appendStagedRecordToLatestHistoryRecord = (): void => {
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
	 * @param record The record to check.
	 * @return Whether the record is empty.
	 */
	const isRecordEmpty = ( record: HistoryRecord< T > ): boolean => {
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
		addRecord( record?: HistoryRecord< T >, isStaged = false ): void {
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

		undo(): HistoryRecord< T > | undefined {
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

		redo(): HistoryRecord< T > | undefined {
			const redoRecord = history[ history.length + offset ];
			if ( ! redoRecord ) {
				return;
			}
			offset += 1;
			return redoRecord;
		},

		hasUndo(): boolean {
			return !! history[ history.length - 1 + offset ];
		},

		hasRedo(): boolean {
			return !! history[ history.length + offset ];
		},
	};
}
