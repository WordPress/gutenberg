import * as Y from 'yjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LOCAL_EDITOR_ORIGIN } from '../config';
import { createEntityUndoManager } from '../undo-manager';

describe( 'EntityUndoManager', () => {
	const docs: Y.Doc[] = [];

	afterEach( () => {
		docs.splice( 0 ).forEach( ( doc ) => doc.destroy() );
	} );

	function createEntity() {
		const doc = new Y.Doc();
		docs.push( doc );

		const map = doc.getMap( 'record' );
		const handlers = {
			addUndoMeta: vi.fn(),
			onUndoLevelOpened: vi.fn(),
			restoreUndoMeta: vi.fn(),
		};

		return {
			doc,
			map,
			handlers,
			undoManager: createEntityUndoManager( doc, map, handlers ),
		};
	}

	type Entity = ReturnType< typeof createEntity >;

	function change( scope: Entity, value: string ) {
		scope.doc.transact( () => {
			scope.map.set( 'title', value );
		}, LOCAL_EDITOR_ORIGIN );
	}

	it( 'reports a new level to the handlers of the entity that opened it', () => {
		const first = createEntity();
		const second = createEntity();

		change( first, 'First changed' );

		expect( first.handlers.onUndoLevelOpened ).toHaveBeenCalledTimes( 1 );
		expect( second.handlers.onUndoLevelOpened ).not.toHaveBeenCalled();
		expect( first.undoManager.hasUndo() ).toBe( true );
		expect( second.undoManager.hasUndo() ).toBe( false );

		// A change right after the previous one merges into its level.
		change( first, 'First changed again' );

		expect( first.handlers.onUndoLevelOpened ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not report the stack items that undo and redo add', () => {
		const entity = createEntity();

		change( entity, 'Changed' );
		entity.handlers.onUndoLevelOpened.mockClear();

		expect( entity.undoManager.undo() ).toBe( true );
		expect( entity.map.get( 'title' ) ).toBeUndefined();
		expect( entity.undoManager.hasRedo() ).toBe( true );

		expect( entity.undoManager.redo() ).toBe( true );
		expect( entity.map.get( 'title' ) ).toBe( 'Changed' );

		expect( entity.handlers.onUndoLevelOpened ).not.toHaveBeenCalled();
	} );

	it( 'returns false when there is no level to move', () => {
		const entity = createEntity();

		expect( entity.undoManager.undo() ).toBe( false );
		expect( entity.undoManager.redo() ).toBe( false );
	} );

	it( 'only moves the levels of its own entity', () => {
		const first = createEntity();
		const second = createEntity();

		change( first, 'First changed' );
		change( second, 'Second changed' );

		// The second entity has the most recent level, but the first is asked.
		expect( first.undoManager.undo() ).toBe( true );
		expect( first.map.get( 'title' ) ).toBeUndefined();
		expect( second.map.get( 'title' ) ).toBe( 'Second changed' );
	} );

	it( 'opens a new level after stopCapturing and drops the redo levels on clearRedo', () => {
		const entity = createEntity();

		change( entity, 'First' );
		entity.undoManager.stopCapturing();
		change( entity, 'Second' );

		expect( entity.handlers.onUndoLevelOpened ).toHaveBeenCalledTimes( 2 );

		entity.undoManager.undo();
		expect( entity.map.get( 'title' ) ).toBe( 'First' );
		expect( entity.undoManager.hasRedo() ).toBe( true );

		entity.undoManager.clearRedo();
		expect( entity.undoManager.hasRedo() ).toBe( false );
		expect( entity.undoManager.redo() ).toBe( false );
		expect( entity.map.get( 'title' ) ).toBe( 'First' );
	} );

	it( 'only runs metadata handlers for the entity that created the stack item', () => {
		const first = createEntity();
		const second = createEntity();

		change( first, 'First changed' );

		expect( first.handlers.addUndoMeta ).toHaveBeenCalledTimes( 1 );
		expect( first.handlers.addUndoMeta ).toHaveBeenCalledWith(
			first.doc,
			expect.any( Map )
		);
		expect( second.handlers.addUndoMeta ).not.toHaveBeenCalled();

		first.undoManager.undo();

		// Undoing creates a redo stack item, so metadata must also be
		// captured for redo selection restoration.
		expect( first.handlers.addUndoMeta ).toHaveBeenCalledTimes( 2 );
		expect( first.handlers.restoreUndoMeta ).toHaveBeenCalledTimes( 1 );
		expect( second.handlers.addUndoMeta ).not.toHaveBeenCalled();
		expect( second.handlers.restoreUndoMeta ).not.toHaveBeenCalled();

		first.undoManager.redo();

		expect( first.handlers.addUndoMeta ).toHaveBeenCalledTimes( 3 );
		expect( first.handlers.restoreUndoMeta ).toHaveBeenCalledTimes( 2 );
		expect( second.handlers.addUndoMeta ).not.toHaveBeenCalled();
		expect( second.handlers.restoreUndoMeta ).not.toHaveBeenCalled();
	} );
} );
