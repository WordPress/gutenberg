import { describe, expect, it, vi } from 'vitest';
import { createUndoManager } from '@wordpress/undo-manager';
import {
	applyUndoLevel,
	createSyncUndoLevelRecord,
	recordEntityEdit,
} from '../sync-undo-levels';

// A stand-in for the entity sync manager: it syncs the records in
// `syncedIds` and keeps its levels as a plain array.
function createSyncManager( syncedIds = [ 'postType/post/1' ] ) {
	const synced = new Set( syncedIds );
	let undoLevels = 0;
	let redoLevels = 0;

	return {
		synced,
		isSynced: ( kind, name, recordId ) =>
			synced.has( `${ kind }/${ name }/${ recordId }` ),
		undoHistory: {
			undo: vi.fn( () => {
				if ( ! undoLevels ) {
					return false;
				}
				undoLevels -= 1;
				redoLevels += 1;
				return true;
			} ),
			redo: vi.fn( () => {
				if ( ! redoLevels ) {
					return false;
				}
				redoLevels -= 1;
				undoLevels += 1;
				return true;
			} ),
			stopCapturing: vi.fn(),
			clearRedo: vi.fn( () => {
				redoLevels = 0;
			} ),
		},
		// The manager opened a level for a synced record: it reports it, and
		// core-data records the placeholder.
		openLevel( undoManager ) {
			undoLevels += 1;
			redoLevels = 0;
			undoManager.addRecord( createSyncUndoLevelRecord() );
		},
		dropLevels() {
			undoLevels = 0;
			redoLevels = 0;
		},
	};
}

function createRecord( recordId, from, to, name = 'note' ) {
	return [
		{
			id: { kind: 'root', name, recordId },
			changes: { title: { from, to } },
		},
	];
}

describe( 'recordEntityEdit', () => {
	it( 'records the edit and closes the current sync level', () => {
		const undoManager = createUndoManager();
		const syncManager = createSyncManager();
		const record = createRecord( 1, 'a', 'b' );

		recordEntityEdit( undoManager, syncManager, record );

		expect( undoManager.hasUndo() ).toBe( true );
		expect( undoManager.undo() ).toEqual( record );
		expect( syncManager.undoHistory.stopCapturing ).toHaveBeenCalled();
	} );

	it( 'merges staged edits into the current level', () => {
		const undoManager = createUndoManager();

		recordEntityEdit( undoManager, undefined, createRecord( 1, 'a', 'b' ) );
		recordEntityEdit(
			undoManager,
			undefined,
			createRecord( 1, 'b', 'c' ),
			true
		);

		expect( undoManager.undo() ).toEqual( createRecord( 1, 'a', 'c' ) );
		expect( undoManager.hasUndo() ).toBe( false );
	} );

	it( 'ends the redo history in both places, also for a staged edit', () => {
		const undoManager = createUndoManager();
		const syncManager = createSyncManager();

		syncManager.openLevel( undoManager );
		applyUndoLevel( undoManager, syncManager, 'undo' );
		expect( undoManager.hasRedo() ).toBe( true );

		recordEntityEdit(
			undoManager,
			syncManager,
			createRecord( 1, 'a', 'b' ),
			true
		);

		expect( undoManager.hasRedo() ).toBe( false );
		expect( syncManager.undoHistory.clearRedo ).toHaveBeenCalled();
	} );

	it( 'closes the current level without a record', () => {
		const undoManager = createUndoManager();
		const syncManager = createSyncManager();

		recordEntityEdit(
			undoManager,
			syncManager,
			createRecord( 1, 'a', 'b' ),
			true
		);
		recordEntityEdit( undoManager, syncManager );
		recordEntityEdit(
			undoManager,
			syncManager,
			createRecord( 1, 'b', 'c' )
		);

		expect( undoManager.undo() ).toEqual( createRecord( 1, 'b', 'c' ) );
		expect( undoManager.undo() ).toEqual( createRecord( 1, 'a', 'b' ) );
		expect( syncManager.undoHistory.stopCapturing ).toHaveBeenCalledTimes(
			3
		);
	} );
} );

describe( 'applyUndoLevel', () => {
	it( 'returns undefined when there is nothing to move', () => {
		const undoManager = createUndoManager();

		expect(
			applyUndoLevel( undoManager, undefined, 'undo' )
		).toBeUndefined();
		expect(
			applyUndoLevel( undoManager, undefined, 'redo' )
		).toBeUndefined();
	} );

	it( 'delegates sync levels and returns the other records in order', () => {
		const undoManager = createUndoManager();
		const syncManager = createSyncManager();
		const record = createRecord( 1, 'a', 'b' );

		// A synced edit, a non-synced edit, another synced edit.
		syncManager.openLevel( undoManager );
		recordEntityEdit( undoManager, syncManager, record );
		syncManager.openLevel( undoManager );

		expect( applyUndoLevel( undoManager, syncManager, 'undo' ) ).toEqual(
			[]
		);
		expect( syncManager.undoHistory.undo ).toHaveBeenCalledTimes( 1 );
		expect( applyUndoLevel( undoManager, syncManager, 'undo' ) ).toEqual(
			record
		);
		expect( syncManager.undoHistory.undo ).toHaveBeenCalledTimes( 1 );
		expect( applyUndoLevel( undoManager, syncManager, 'undo' ) ).toEqual(
			[]
		);
		expect( syncManager.undoHistory.undo ).toHaveBeenCalledTimes( 2 );
		expect( undoManager.hasUndo() ).toBe( false );

		expect( applyUndoLevel( undoManager, syncManager, 'redo' ) ).toEqual(
			[]
		);
		expect( applyUndoLevel( undoManager, syncManager, 'redo' ) ).toEqual(
			record
		);
		expect( applyUndoLevel( undoManager, syncManager, 'redo' ) ).toEqual(
			[]
		);
		expect( syncManager.undoHistory.redo ).toHaveBeenCalledTimes( 2 );
		expect( undoManager.hasRedo() ).toBe( false );

		// Each move closes the level so the next change opens a new one.
		expect( syncManager.undoHistory.stopCapturing ).toHaveBeenCalled();
	} );

	it( 'applies the records merged into a sync level alongside it', () => {
		const undoManager = createUndoManager();
		const syncManager = createSyncManager();
		const staged = createRecord( 1, 'a', 'b' );

		syncManager.openLevel( undoManager );
		// Typing right after the synced change merges into its level.
		undoManager.addRecord( staged, true );

		expect( applyUndoLevel( undoManager, syncManager, 'undo' ) ).toEqual(
			staged
		);
		expect( syncManager.undoHistory.undo ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'skips a sync level the manager no longer has', () => {
		const undoManager = createUndoManager();
		const syncManager = createSyncManager();
		const record = createRecord( 1, 'a', 'b' );

		recordEntityEdit( undoManager, syncManager, record );
		syncManager.openLevel( undoManager );
		// Its document was unloaded.
		syncManager.dropLevels();

		expect( applyUndoLevel( undoManager, syncManager, 'undo' ) ).toEqual(
			record
		);
		expect(
			applyUndoLevel( undoManager, syncManager, 'undo' )
		).toBeUndefined();
	} );

	it( 'skips a record for an entity that has become synced since', () => {
		const undoManager = createUndoManager();
		const syncManager = createSyncManager();

		recordEntityEdit(
			undoManager,
			syncManager,
			createRecord( 2, 'a', 'b' )
		);
		syncManager.synced.add( 'root/note/2' );

		expect(
			applyUndoLevel( undoManager, syncManager, 'undo' )
		).toBeUndefined();
		expect( undoManager.hasUndo() ).toBe( false );
	} );
} );
