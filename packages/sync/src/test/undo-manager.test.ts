/**
 * External dependencies
 */
import * as Y from 'yjs';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

/**
 * Internal dependencies
 */
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
				addUndoMeta: jest.fn(),
				restoreUndoMeta: jest.fn(),
			},
		};
	}

	it( 'only runs metadata handlers for the document that created the stack item', () => {
		const undoManager = createUndoManager();
		const first = createScopedMap();
		const second = createScopedMap();

		undoManager.addToScope( first.map, first.handlers );
		undoManager.addToScope( second.map, second.handlers );

		first.doc.transact( () => {
			first.map.set( 'title', 'First changed' );
		}, LOCAL_EDITOR_ORIGIN );

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

		first.doc.transact( () => {
			first.map.set( 'title', 'First changed again' );
		}, LOCAL_EDITOR_ORIGIN );

		second.doc.transact( () => {
			second.map.set( 'title', 'Second changed' );
		}, LOCAL_EDITOR_ORIGIN );

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
