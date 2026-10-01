import { describe, expect, it, vi } from 'vitest';
import { createUndoManager } from '@wordpress/undo-manager';
import {
	applyUndoLevel,
	createSyncUndoLevelRecord,
	recordEntityEdit,
} from '../sync-undo-levels';

// A stand-in for the entity sync manager: it syncs the records in
// `syncedIds` and keeps the levels of each record as plain counts.
function createSyncManager( syncedIds = [ 'postType/post/1' ] ) {
	const synced = new Set( syncedIds );
	const levels = new Map();
	// Levels of deferred local changes, opened when the manager flushes.
	const deferredLevels = [];
	const getLevels = ( kind, name, recordId ) => {
		const key = `${ kind }/${ name }/${ recordId }`;
		if ( ! levels.has( key ) ) {
			levels.set( key, { undo: 0, redo: 0 } );
		}
		return levels.get( key );
	};

	return {
		synced,
		isLoaded: ( kind, name, recordId ) =>
			synced.has( `${ kind }/${ name }/${ recordId }` ),
		undoHistory: {
			undo: vi.fn( ( kind, name, recordId ) => {
				const record = getLevels( kind, name, recordId );
				if ( ! record.undo ) {
					return false;
				}
				record.undo -= 1;
				record.redo += 1;
				return true;
			} ),
			redo: vi.fn( ( kind, name, recordId ) => {
				const record = getLevels( kind, name, recordId );
				if ( ! record.redo ) {
					return false;
				}
				record.redo -= 1;
				record.undo += 1;
				return true;
			} ),
			// Like the sync manager, closing the level applies deferred
			// changes first, which opens their levels.
			stopCapturing: vi.fn( () => {
				deferredLevels.splice( 0 ).forEach( ( open ) => open() );
			} ),
			clearRedo: vi.fn( () => {
				levels.forEach( ( record ) => {
					record.redo = 0;
				} );
			} ),
		},
		// The manager opened a level for a synced record: it reports it, and
		// core-data records the placeholder naming the record.
		openLevel(
			undoManager,
			kind = 'postType',
			name = 'post',
			recordId = 1
		) {
			const record = getLevels( kind, name, recordId );
			record.undo += 1;
			record.redo = 0;
			undoManager.addRecord(
				createSyncUndoLevelRecord( kind, name, recordId )
			);
		},
		// A local change to a synced record that the manager has not
		// applied yet: its level opens on the next flush.
		deferLevel(
			undoManager,
			kind = 'postType',
			name = 'post',
			recordId = 1
		) {
			deferredLevels.push( () =>
				this.openLevel( undoManager, kind, name, recordId )
			);
		},
		// The record was unloaded: it is no longer synced and its levels
		// are gone.
		unload( kind = 'postType', name = 'post', recordId = 1 ) {
			synced.delete( `${ kind }/${ name }/${ recordId }` );
			levels.delete( `${ kind }/${ name }/${ recordId }` );
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
		syncManager.unload();

		expect( applyUndoLevel( undoManager, syncManager, 'undo' ) ).toEqual(
			record
		);
		expect(
			applyUndoLevel( undoManager, syncManager, 'undo' )
		).toBeUndefined();
	} );

	it( 'delegates each sync level to the record that opened it', () => {
		const undoManager = createUndoManager();
		const syncManager = createSyncManager( [
			'postType/post/1',
			'postType/wp_template_part/2',
		] );

		syncManager.openLevel( undoManager, 'postType', 'post', 1 );
		syncManager.openLevel( undoManager, 'postType', 'wp_template_part', 2 );

		applyUndoLevel( undoManager, syncManager, 'undo' );
		expect( syncManager.undoHistory.undo ).toHaveBeenLastCalledWith(
			'postType',
			'wp_template_part',
			2
		);

		applyUndoLevel( undoManager, syncManager, 'undo' );
		expect( syncManager.undoHistory.undo ).toHaveBeenLastCalledWith(
			'postType',
			'post',
			1
		);

		applyUndoLevel( undoManager, syncManager, 'redo' );
		expect( syncManager.undoHistory.redo ).toHaveBeenLastCalledWith(
			'postType',
			'post',
			1
		);
	} );

	it( 'does not move another record for the level of an unloaded record', () => {
		const undoManager = createUndoManager();
		const syncManager = createSyncManager( [
			'postType/post/1',
			'postType/wp_template_part/2',
		] );
		const record = createRecord( 3, 'a', 'b', 'site' );

		// A synced post edit, a site edit, then a synced template part edit.
		syncManager.openLevel( undoManager, 'postType', 'post', 1 );
		recordEntityEdit( undoManager, syncManager, record );
		syncManager.openLevel( undoManager, 'postType', 'wp_template_part', 2 );

		// The template part is deleted, which unloads it.
		syncManager.unload( 'postType', 'wp_template_part', 2 );

		// Its level is skipped, and the site edit is undone before the post.
		expect( applyUndoLevel( undoManager, syncManager, 'undo' ) ).toEqual(
			record
		);
		expect( syncManager.undoHistory.undo ).not.toHaveBeenCalled();

		expect( applyUndoLevel( undoManager, syncManager, 'undo' ) ).toEqual(
			[]
		);
		expect( syncManager.undoHistory.undo ).toHaveBeenCalledWith(
			'postType',
			'post',
			1
		);
	} );

	it( 'moves a level whose deferred change has not been applied yet', () => {
		const undoManager = createUndoManager();
		const syncManager = createSyncManager();
		const record = createRecord( 1, 'a', 'b', 'site' );

		// A site edit, then typing in the synced post. The manager defers
		// the typing, so its level is not in the history yet.
		recordEntityEdit( undoManager, syncManager, record );
		syncManager.deferLevel( undoManager );

		// Undo, before the deferred change is applied, moves the typing.
		expect( applyUndoLevel( undoManager, syncManager, 'undo' ) ).toEqual(
			[]
		);
		expect( syncManager.undoHistory.undo ).toHaveBeenCalledWith(
			'postType',
			'post',
			1
		);

		// Then the site edit.
		expect( applyUndoLevel( undoManager, syncManager, 'undo' ) ).toEqual(
			record
		);
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
