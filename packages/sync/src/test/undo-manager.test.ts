import * as Y from 'yjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LOCAL_EDITOR_ORIGIN } from '../config';
import { createUndoManager } from '../undo-manager';
import type { SyncUndoManager } from '../types';

describe( 'SyncUndoManager', () => {
	const docs: Y.Doc[] = [];
	let nextObjectId = 1;

	afterEach( () => {
		docs.splice( 0 ).forEach( ( doc ) => doc.destroy() );
	} );

	function createScopedMap() {
		const doc = new Y.Doc();
		docs.push( doc );
		return {
			doc,
			map: doc.getMap( 'record' ),
			objectType: 'postType/post',
			objectId: String( nextObjectId++ ),
			handlers: {
				addUndoMeta: vi.fn(),
				onUndoLevelOpened: vi.fn(),
				restoreUndoMeta: vi.fn(),
			},
		};
	}

	type Scope = ReturnType< typeof createScopedMap >;

	function addToScope( undoManager: SyncUndoManager, scope: Scope ) {
		undoManager.addToScope(
			scope.objectType,
			scope.objectId,
			scope.map,
			scope.handlers
		);
	}

	function undo( undoManager: SyncUndoManager, scope: Scope ) {
		return undoManager.undo( scope.objectType, scope.objectId );
	}

	function redo( undoManager: SyncUndoManager, scope: Scope ) {
		return undoManager.redo( scope.objectType, scope.objectId );
	}

	function change( scope: Scope, value: string ) {
		scope.doc.transact( () => {
			scope.map.set( 'title', value );
		}, LOCAL_EDITOR_ORIGIN );
	}

	it( 'reports a new level to the handlers of the document that opened it', () => {
		const undoManager = createUndoManager();
		const first = createScopedMap();
		const second = createScopedMap();

		addToScope( undoManager, first );
		addToScope( undoManager, second );

		change( first, 'First changed' );

		expect( first.handlers.onUndoLevelOpened ).toHaveBeenCalledTimes( 1 );
		expect( second.handlers.onUndoLevelOpened ).not.toHaveBeenCalled();
		expect( undoManager.hasUndo() ).toBe( true );

		// A change right after the previous one merges into its level.
		change( first, 'First changed again' );

		expect( first.handlers.onUndoLevelOpened ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not report the stack items that undo and redo add', () => {
		const undoManager = createUndoManager();
		const scope = createScopedMap();
		addToScope( undoManager, scope );

		change( scope, 'Changed' );
		scope.handlers.onUndoLevelOpened.mockClear();

		expect( undo( undoManager, scope ) ).toBe( true );
		expect( scope.map.get( 'title' ) ).toBeUndefined();
		expect( undoManager.hasRedo() ).toBe( true );

		expect( redo( undoManager, scope ) ).toBe( true );
		expect( scope.map.get( 'title' ) ).toBe( 'Changed' );

		expect( scope.handlers.onUndoLevelOpened ).not.toHaveBeenCalled();
	} );

	it( 'returns false when there is no level to move', () => {
		const undoManager = createUndoManager();
		const scope = createScopedMap();
		addToScope( undoManager, scope );

		expect( undo( undoManager, scope ) ).toBe( false );
		expect( redo( undoManager, scope ) ).toBe( false );

		// A level whose document was unloaded is gone too.
		change( scope, 'Changed' );
		scope.doc.destroy();

		expect( undoManager.hasUndo() ).toBe( false );
		expect( undo( undoManager, scope ) ).toBe( false );
	} );

	it( 'only moves the levels of the entity it is asked for', () => {
		const undoManager = createUndoManager();
		const first = createScopedMap();
		const second = createScopedMap();
		addToScope( undoManager, first );
		addToScope( undoManager, second );

		change( first, 'First changed' );
		change( second, 'Second changed' );

		// The second entity has the most recent level, but the first is asked.
		expect( undo( undoManager, first ) ).toBe( true );
		expect( first.map.get( 'title' ) ).toBeUndefined();
		expect( second.map.get( 'title' ) ).toBe( 'Second changed' );
	} );

	it( 'does not move another entity when the entity asked for was unloaded', () => {
		const undoManager = createUndoManager();
		const first = createScopedMap();
		const second = createScopedMap();
		addToScope( undoManager, first );
		addToScope( undoManager, second );

		change( first, 'First changed' );
		change( second, 'Second changed' );
		second.doc.destroy();

		expect( undo( undoManager, second ) ).toBe( false );
		expect( first.map.get( 'title' ) ).toBe( 'First changed' );
	} );

	it( 'closes the levels of other entities and drops their redo levels when one opens a level', () => {
		const undoManager = createUndoManager();
		const first = createScopedMap();
		const second = createScopedMap();
		addToScope( undoManager, first );
		addToScope( undoManager, second );

		change( first, 'First' );
		change( second, 'Second' );

		// Without closing, this would merge into the first entity's level,
		// which now sits below the second entity's level.
		change( first, 'First again' );
		expect( first.handlers.onUndoLevelOpened ).toHaveBeenCalledTimes( 2 );

		expect( undo( undoManager, second ) ).toBe( true );
		expect( undoManager.hasRedo() ).toBe( true );

		// A new level anywhere ends the redo history of every entity.
		undoManager.stopCapturing();
		change( first, 'First once more' );
		expect( undoManager.hasRedo() ).toBe( false );
		expect( redo( undoManager, second ) ).toBe( false );
	} );

	it( 'opens a new level after stopCapturing and drops the redo levels on clearRedo', () => {
		const undoManager = createUndoManager();
		const scope = createScopedMap();
		addToScope( undoManager, scope );

		change( scope, 'First' );
		undoManager.stopCapturing();
		change( scope, 'Second' );

		expect( scope.handlers.onUndoLevelOpened ).toHaveBeenCalledTimes( 2 );

		undo( undoManager, scope );
		expect( scope.map.get( 'title' ) ).toBe( 'First' );
		expect( undoManager.hasRedo() ).toBe( true );

		undoManager.clearRedo();
		expect( undoManager.hasRedo() ).toBe( false );
		expect( redo( undoManager, scope ) ).toBe( false );
		expect( scope.map.get( 'title' ) ).toBe( 'First' );
	} );

	it( 'lands deferred changes before reading or moving the history', () => {
		const scope = createScopedMap();
		const pending: Array< () => void > = [];
		const flushPendingUpdates = vi.fn( () => {
			pending.splice( 0 ).forEach( ( apply ) => apply() );
		} );
		const undoManager = createUndoManager( { flushPendingUpdates } );
		addToScope( undoManager, scope );

		pending.push( () => change( scope, 'Deferred' ) );

		// Closing the level lands the deferred change in it first.
		undoManager.stopCapturing();
		expect( flushPendingUpdates ).toHaveBeenCalledTimes( 1 );
		expect( scope.map.get( 'title' ) ).toBe( 'Deferred' );
		expect( scope.handlers.onUndoLevelOpened ).toHaveBeenCalledTimes( 1 );

		pending.push( () => change( scope, 'Deferred again' ) );

		// Undo applies to the deferred change, not to what came before it.
		expect( undo( undoManager, scope ) ).toBe( true );
		expect( scope.map.get( 'title' ) ).toBe( 'Deferred' );
	} );

	it( 'only runs metadata handlers for the document that created the stack item', () => {
		const undoManager = createUndoManager();
		const first = createScopedMap();
		const second = createScopedMap();

		addToScope( undoManager, first );
		addToScope( undoManager, second );

		change( first, 'First changed' );

		expect( first.map.get( 'title' ) ).toBe( 'First changed' );
		expect( second.map.get( 'title' ) ).toBeUndefined();
		expect( first.handlers.addUndoMeta ).toHaveBeenCalledTimes( 1 );
		expect( second.handlers.addUndoMeta ).not.toHaveBeenCalled();

		undo( undoManager, first );

		expect( first.map.get( 'title' ) ).toBeUndefined();
		expect( second.map.get( 'title' ) ).toBeUndefined();
		// Undoing creates a redo stack item, so metadata must also be
		// captured for redo selection restoration.
		expect( first.handlers.addUndoMeta ).toHaveBeenCalledTimes( 2 );
		expect( second.handlers.addUndoMeta ).not.toHaveBeenCalled();
		expect( first.handlers.restoreUndoMeta ).toHaveBeenCalledTimes( 1 );
		expect( second.handlers.restoreUndoMeta ).not.toHaveBeenCalled();

		first.handlers.addUndoMeta.mockClear();
		first.handlers.restoreUndoMeta.mockClear();
		second.handlers.addUndoMeta.mockClear();
		second.handlers.restoreUndoMeta.mockClear();

		change( first, 'First changed again' );
		change( second, 'Second changed' );

		expect( first.map.get( 'title' ) ).toBe( 'First changed again' );
		expect( second.map.get( 'title' ) ).toBe( 'Second changed' );
		expect( first.handlers.addUndoMeta ).toHaveBeenCalledTimes( 1 );
		expect( second.handlers.addUndoMeta ).toHaveBeenCalledTimes( 1 );

		undo( undoManager, second );

		expect( first.map.get( 'title' ) ).toBe( 'First changed again' );
		expect( second.map.get( 'title' ) ).toBeUndefined();
		expect( first.handlers.addUndoMeta ).toHaveBeenCalledTimes( 1 );
		expect( second.handlers.addUndoMeta ).toHaveBeenCalledTimes( 2 );
		expect( first.handlers.restoreUndoMeta ).not.toHaveBeenCalled();
		expect( second.handlers.restoreUndoMeta ).toHaveBeenCalledTimes( 1 );

		redo( undoManager, second );

		expect( first.map.get( 'title' ) ).toBe( 'First changed again' );
		expect( second.map.get( 'title' ) ).toBe( 'Second changed' );
		expect( first.handlers.addUndoMeta ).toHaveBeenCalledTimes( 1 );
		expect( second.handlers.addUndoMeta ).toHaveBeenCalledTimes( 3 );
		expect( first.handlers.restoreUndoMeta ).not.toHaveBeenCalled();
		expect( second.handlers.restoreUndoMeta ).toHaveBeenCalledTimes( 2 );
	} );
} );
