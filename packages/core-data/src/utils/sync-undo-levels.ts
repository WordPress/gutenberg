/**
 * How core-data's undo manager and an entity sync manager share one undo
 * history.
 *
 * core-data records every edit in its own undo manager, except edits to
 * records the sync manager is syncing: the manager tracks those itself and
 * reports each undo level it opens. core-data then records a placeholder for
 * the level that names its record, so both kinds of edits are undone in the
 * order they were made. When a placeholder is undone or redone, the level is
 * delegated back to the sync manager for that record.
 */

import type {
	HistoryChanges,
	HistoryRecord,
	UndoManager,
} from '@wordpress/undo-manager';
import type { EntitySyncManager, EntitySyncRecordId } from '../entity-sync';

type UndoLevelType = 'undo' | 'redo';

/**
 * The record an entry of the undo history belongs to.
 */
interface RecordReference {
	kind: string;
	name: string;
	recordId: EntitySyncRecordId;
}

/**
 * One level taken off the undo history.
 */
interface UndoLevel {
	/** The changes to apply to the store. */
	changes: HistoryRecord;

	/** Whether the level applied anything, in the store or the sync manager. */
	didApply: boolean;
}

let syncUndoLevelCount = 0;

/**
 * Creates the undo record that stands in for one of the sync manager's undo
 * levels of a record. Its changes carry a running count so the record is
 * never considered empty; they are never applied to an entity.
 *
 * The `isSyncUndoLevel` key keeps the id distinct from the record's own id,
 * so the undo manager never merges an edit to the record into a placeholder.
 *
 * @param kind     Kind of the record.
 * @param name     Name of the record.
 * @param recordId Id of the record.
 *
 * @return The record.
 */
export function createSyncUndoLevelRecord(
	kind: string,
	name: string,
	recordId: EntitySyncRecordId
): HistoryRecord {
	syncUndoLevelCount += 1;

	return [
		{
			id: { kind, name, recordId, isSyncUndoLevel: true },
			changes: {
				level: {
					from: syncUndoLevelCount - 1,
					to: syncUndoLevelCount,
				},
			},
		},
	];
}

function isSyncUndoLevel( changes: HistoryChanges ): boolean {
	return (
		'string' !== typeof changes.id && true === changes.id.isSyncUndoLevel
	);
}

/**
 * Reads the record an entry of the undo history belongs to from its id.
 *
 * @param id The id of the entry.
 *
 * @return The record, or undefined when the id does not name one.
 */
function getRecordReference(
	id: HistoryChanges[ 'id' ]
): RecordReference | undefined {
	if ( 'string' === typeof id ) {
		return undefined;
	}

	const { kind, name, recordId } = id;

	if ( 'string' !== typeof kind || 'string' !== typeof name ) {
		return undefined;
	}

	if ( 'string' !== typeof recordId && 'number' !== typeof recordId ) {
		return undefined;
	}

	return { kind, name, recordId };
}

function isLoadedRecord(
	syncManager: EntitySyncManager | undefined,
	record: RecordReference | undefined
): boolean {
	if ( ! record ) {
		return false;
	}

	return Boolean(
		syncManager?.isLoaded?.( record.kind, record.name, record.recordId )
	);
}

/**
 * Records an edit to entities the sync manager does not sync, or, without a
 * record, closes the current undo level.
 *
 * @param undoManager core-data's undo manager.
 * @param syncManager The registered entity sync manager.
 * @param record      The record of changes; omit it to close the current undo
 *                    level.
 * @param isStaged    Whether to merge the changes into the current undo level
 *                    instead of opening a new one.
 */
export function recordEntityEdit(
	undoManager: UndoManager,
	syncManager?: EntitySyncManager,
	record?: HistoryRecord,
	isStaged: boolean = false
): void {
	const undoHistory = syncManager?.undoHistory;

	// The sync manager must not merge a later synced change into the level
	// this record now sits on top of.
	undoHistory?.stopCapturing();

	// A new edit ends the redo history, in both places.
	undoHistory?.clearRedo();

	if ( ! record ) {
		undoManager.addRecord();
		return;
	}

	if ( isStaged && undoManager.hasRedo() ) {
		undoManager.addRecord();
	}

	undoManager.addRecord( record, isStaged );
}

/**
 * Takes the next level off the history and applies its sync manager part.
 *
 * @param undoManager core-data's undo manager.
 * @param syncManager The registered entity sync manager.
 * @param type        Which direction to move in.
 *
 * @return The level. Undefined when the history is exhausted.
 */
function popUndoLevel(
	undoManager: UndoManager,
	syncManager: EntitySyncManager | undefined,
	type: UndoLevelType
): UndoLevel | undefined {
	const undoHistory = syncManager?.undoHistory;
	let record: HistoryRecord | undefined;

	if ( 'undo' === type ) {
		record = undoManager.undo();
	} else {
		record = undoManager.redo();
	}

	if ( ! record ) {
		return undefined;
	}

	const changes = record.filter(
		( entry ) =>
			! isSyncUndoLevel( entry ) &&
			! isLoadedRecord( syncManager, getRecordReference( entry.id ) )
	);

	// Only the record that opened the level can move it. When the record is
	// no longer loaded, the level is stale and applies nothing.
	const syncLevel = record.find( isSyncUndoLevel );
	let syncLevelRecord: RecordReference | undefined;

	if ( syncLevel ) {
		syncLevelRecord = getRecordReference( syncLevel.id );
	}

	let didApplySyncLevel = false;

	if (
		undoHistory &&
		syncLevelRecord &&
		isLoadedRecord( syncManager, syncLevelRecord )
	) {
		const { kind, name, recordId } = syncLevelRecord;
		didApplySyncLevel = undoHistory[ type ]( kind, name, recordId );
	}

	return {
		changes,
		didApply: changes.length > 0 || didApplySyncLevel,
	};
}

/**
 * Undoes or redoes the next level of the history.
 *
 * A level whose entities are no longer reachable is skipped: a sync manager
 * level whose document was unloaded, or a record for an entity that has become
 * synced since it was recorded (its shared document never saw the change, so
 * applying the record would fork the two).
 *
 * @param undoManager core-data's undo manager.
 * @param syncManager The registered entity sync manager.
 * @param type        Which direction to move in.
 *
 * @return The changes to apply to the store. Empty when the level belonged to
 *         the sync manager, which applies it through its documents. Undefined
 *         when nothing is left to move.
 */
export function applyUndoLevel(
	undoManager: UndoManager,
	syncManager: EntitySyncManager | undefined,
	type: UndoLevelType
): HistoryRecord | undefined {
	// The sync manager may defer local changes. Closing its level applies
	// them first, so their levels are in the history before one is moved.
	syncManager?.undoHistory?.stopCapturing();

	let level = popUndoLevel( undoManager, syncManager, type );

	// A level that applied nothing is stale. Move past it to the next one.
	while ( level && ! level.didApply ) {
		level = popUndoLevel( undoManager, syncManager, type );
	}

	if ( ! level ) {
		return undefined;
	}

	// The next change must open a new level rather than merge into the one
	// just moved.
	syncManager?.undoHistory?.stopCapturing();

	return level.changes;
}
