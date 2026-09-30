/**
 * How core-data's undo manager and an entity sync manager share one undo
 * history.
 *
 * core-data records every edit in its own undo manager, except edits to
 * records the sync manager is syncing: the manager tracks those itself and
 * reports each undo level it opens. core-data then records a placeholder for
 * the level, so both kinds of edits are undone in the order they were made.
 * When a placeholder is undone or redone, the level is delegated back to the
 * sync manager.
 */

const SYNC_UNDO_LEVEL_ID = 'core/entity-sync-undo-level';

let syncUndoLevelCount = 0;

/**
 * Creates the undo record that stands in for one of the sync manager's undo
 * levels. Its changes carry a running count so the record is never considered
 * empty; they are never applied to an entity.
 *
 * @return {Array} The record.
 */
export function createSyncUndoLevelRecord() {
	syncUndoLevelCount += 1;

	return [
		{
			id: SYNC_UNDO_LEVEL_ID,
			changes: {
				level: {
					from: syncUndoLevelCount - 1,
					to: syncUndoLevelCount,
				},
			},
		},
	];
}

function isSyncUndoLevel( changes ) {
	return SYNC_UNDO_LEVEL_ID === changes.id;
}

function isSyncedRecord( syncManager, id ) {
	if ( ! id || 'object' !== typeof id ) {
		return false;
	}

	return Boolean( syncManager?.isSynced?.( id.kind, id.name, id.recordId ) );
}

/**
 * Records an edit to entities the sync manager does not sync, or, without a
 * record, closes the current undo level.
 *
 * @param {Object}  undoManager   core-data's undo manager.
 * @param {Object}  [syncManager] The registered entity sync manager.
 * @param {Array}   [record]      The record of changes; omit it to close the
 *                                current undo level.
 * @param {boolean} [isStaged]    Whether to merge the changes into the
 *                                current undo level instead of opening a new
 *                                one.
 */
export function recordEntityEdit(
	undoManager,
	syncManager,
	record,
	isStaged = false
) {
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
 * Undoes or redoes the next level of the history.
 *
 * A level whose entities are no longer reachable is skipped: a sync manager
 * level whose document was unloaded, or a record for an entity that has become
 * synced since it was recorded (its shared document never saw the change, so
 * applying the record would fork the two).
 *
 * @param {Object}        undoManager   core-data's undo manager.
 * @param {Object}        [syncManager] The registered entity sync manager.
 * @param {'undo'|'redo'} type          Which direction to move in.
 *
 * @return {Array|undefined} The changes to apply to the store. Empty when the
 *                           level belonged to the sync manager, which applies
 *                           it through its documents. Undefined when nothing
 *                           is left to move.
 */
export function applyUndoLevel( undoManager, syncManager, type ) {
	const undoHistory = syncManager?.undoHistory;

	for (;;) {
		const record =
			'undo' === type ? undoManager.undo() : undoManager.redo();

		if ( ! record ) {
			return undefined;
		}

		const changes = record.filter(
			( entry ) =>
				! isSyncUndoLevel( entry ) &&
				! isSyncedRecord( syncManager, entry.id )
		);

		let didApplySyncLevel = false;

		if ( undoHistory && record.some( isSyncUndoLevel ) ) {
			didApplySyncLevel =
				'undo' === type ? undoHistory.undo() : undoHistory.redo();
		}

		if ( ! changes.length && ! didApplySyncLevel ) {
			continue;
		}

		// The next change must open a new level rather than merge into the
		// one just moved.
		undoHistory?.stopCapturing();

		return changes;
	}
}
