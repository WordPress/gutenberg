import * as Y from 'yjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LOCAL_EDITOR_ORIGIN } from '../config';
import { createUndoManager } from '../undo-manager';

describe( 'SyncUndoManager', () => {
	const docs: Y.Doc[] = [];

	afterEach( () => {
		docs.splice( 0 ).forEach( ( doc ) => doc.destroy() );
	} );

	function createScopedMap() {
		const doc = new Y.Doc();
		docs.push( doc );
		return {
			doc,
			map: doc.getMap( 'record' ),
			handlers: {
				addUndoMeta: vi.fn(),
				onUndoLevelOpened: vi.fn(),
				restoreUndoMeta: vi.fn(),
			},
		};
	}

	function change(
		scope: ReturnType< typeof createScopedMap >,
		value: string
	) {
		scope.doc.transact( () => {
			scope.map.set( 'title', value );
		}, LOCAL_EDITOR_ORIGIN );
	}

	it( 'reports a new level to the handlers of the document that opened it', () => {
		const undoManager = createUndoManager();
		const first = createScopedMap();
		const second = createScopedMap();

		undoManager.addToScope( first.map, first.handlers );
		undoManager.addToScope( second.map, second.handlers );

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
		undoManager.addToScope( scope.map, scope.handlers );

		change( scope, 'Changed' );
		scope.handlers.onUndoLevelOpened.mockClear();

		expect( undoManager.undo() ).toBe( true );
		expect( scope.map.get( 'title' ) ).toBeUndefined();
		expect( undoManager.hasRedo() ).toBe( true );

		expect( undoManager.redo() ).toBe( true );
		expect( scope.map.get( 'title' ) ).toBe( 'Changed' );

		expect( scope.handlers.onUndoLevelOpened ).not.toHaveBeenCalled();
	} );

	it( 'returns false when there is no level to move', () => {
		const undoManager = createUndoManager();
		const scope = createScopedMap();
		undoManager.addToScope( scope.map, scope.handlers );

		expect( undoManager.undo() ).toBe( false );
		expect( undoManager.redo() ).toBe( false );

		// A level whose document was unloaded is gone too.
		change( scope, 'Changed' );
		scope.doc.destroy();

		expect( undoManager.hasUndo() ).toBe( false );
		expect( undoManager.undo() ).toBe( false );
	} );

	it( 'opens a new level after stopCapturing and drops the redo levels on clearRedo', () => {
		const undoManager = createUndoManager();
		const scope = createScopedMap();
		undoManager.addToScope( scope.map, scope.handlers );

		change( scope, 'First' );
		undoManager.stopCapturing();
		change( scope, 'Second' );

		expect( scope.handlers.onUndoLevelOpened ).toHaveBeenCalledTimes( 2 );

		undoManager.undo();
		expect( scope.map.get( 'title' ) ).toBe( 'First' );
		expect( undoManager.hasRedo() ).toBe( true );

		undoManager.clearRedo();
		expect( undoManager.hasRedo() ).toBe( false );
		expect( undoManager.redo() ).toBe( false );
		expect( scope.map.get( 'title' ) ).toBe( 'First' );
	} );

	it( 'lands deferred changes before reading or moving the history', () => {
		const scope = createScopedMap();
		const pending: Array< () => void > = [];
		const flushPendingUpdates = vi.fn( () => {
			pending.splice( 0 ).forEach( ( apply ) => apply() );
		} );
		const undoManager = createUndoManager( { flushPendingUpdates } );
		undoManager.addToScope( scope.map, scope.handlers );

		pending.push( () => change( scope, 'Deferred' ) );

		// Closing the level lands the deferred change in it first.
		undoManager.stopCapturing();
		expect( flushPendingUpdates ).toHaveBeenCalledTimes( 1 );
		expect( scope.map.get( 'title' ) ).toBe( 'Deferred' );
		expect( scope.handlers.onUndoLevelOpened ).toHaveBeenCalledTimes( 1 );

		pending.push( () => change( scope, 'Deferred again' ) );

		// Undo applies to the deferred change, not to what came before it.
		expect( undoManager.undo() ).toBe( true );
		expect( scope.map.get( 'title' ) ).toBe( 'Deferred' );
	} );

	it( 'only runs metadata handlers for the document that created the stack item', () => {
		const undoManager = createUndoManager();
		const first = createScopedMap();
		const second = createScopedMap();

		undoManager.addToScope( first.map, first.handlers );
		undoManager.addToScope( second.map, second.handlers );

		change( first, 'First changed' );

		expect( first.map.get( 'title' ) ).toBe( 'First changed' );
		expect( second.map.get( 'title' ) ).toBeUndefined();
		expect( first.handlers.addUndoMeta ).toHaveBeenCalledTimes( 1 );
		expect( second.handlers.addUndoMeta ).not.toHaveBeenCalled();

		undoManager.undo();

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

		undoManager.undo();

		expect( first.map.get( 'title' ) ).toBe( 'First changed again' );
		expect( second.map.get( 'title' ) ).toBeUndefined();
		expect( first.handlers.addUndoMeta ).toHaveBeenCalledTimes( 1 );
		expect( second.handlers.addUndoMeta ).toHaveBeenCalledTimes( 2 );
		expect( first.handlers.restoreUndoMeta ).not.toHaveBeenCalled();
		expect( second.handlers.restoreUndoMeta ).toHaveBeenCalledTimes( 1 );

		undoManager.redo();

		expect( first.map.get( 'title' ) ).toBe( 'First changed again' );
		expect( second.map.get( 'title' ) ).toBe( 'Second changed' );
		expect( first.handlers.addUndoMeta ).toHaveBeenCalledTimes( 1 );
		expect( second.handlers.addUndoMeta ).toHaveBeenCalledTimes( 3 );
		expect( first.handlers.restoreUndoMeta ).not.toHaveBeenCalled();
		expect( second.handlers.restoreUndoMeta ).toHaveBeenCalledTimes( 2 );
	} );
} );
