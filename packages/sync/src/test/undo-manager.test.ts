import * as Y from 'yjs';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
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
				onUndoStackChange: jest.fn(),
				restoreUndoMeta: jest.fn(),
			},
		};
	}

	it( 'notifies scoped handlers when the Yjs undo stack changes', () => {
		const undoManager = createUndoManager();
		const first = createScopedMap();
		const second = createScopedMap();

		undoManager.addToScope( first.map, first.handlers );
		undoManager.addToScope( second.map, second.handlers );

		first.doc.transact( () => {
			first.map.set( 'title', 'First changed' );
		}, LOCAL_EDITOR_ORIGIN );

		expect( first.handlers.onUndoStackChange ).toHaveBeenCalled();
		expect( second.handlers.onUndoStackChange ).not.toHaveBeenCalled();

		first.handlers.onUndoStackChange.mockClear();

		undoManager.undo();

		expect( first.handlers.onUndoStackChange ).toHaveBeenCalled();
		expect( second.handlers.onUndoStackChange ).not.toHaveBeenCalled();

		first.handlers.onUndoStackChange.mockClear();

		undoManager.redo();

		expect( first.handlers.onUndoStackChange ).toHaveBeenCalled();
		expect( second.handlers.onUndoStackChange ).not.toHaveBeenCalled();
	} );

	it( 'keeps a separate undo history for each scope', () => {
		const undoManager = createUndoManager();
		const template = createScopedMap();
		const navigation = createScopedMap();

		undoManager.addToScope( template.map, template.handlers );
		undoManager.addToScope( navigation.map, navigation.handlers );

		undoManager.setScope( 'postType/wp_template/1' );

		template.doc.transact( () => {
			template.map.set( 'title', 'Template changed' );
		}, LOCAL_EDITOR_ORIGIN );

		expect( undoManager.hasUndo() ).toBe( true );

		// Opening an entity in a focused editor starts a new history.
		undoManager.setScope( 'postType/wp_navigation/2' );

		expect( undoManager.hasUndo() ).toBe( false );

		// Undoing there must not revert the changes of the other scope.
		undoManager.undo();

		expect( template.map.get( 'title' ) ).toBe( 'Template changed' );

		navigation.doc.transact( () => {
			navigation.map.set( 'title', 'Navigation changed' );
		}, LOCAL_EDITOR_ORIGIN );

		expect( undoManager.hasUndo() ).toBe( true );

		undoManager.undo();

		expect( navigation.map.get( 'title' ) ).toBeUndefined();
		expect( template.map.get( 'title' ) ).toBe( 'Template changed' );

		// Navigating back restores the history of the previous scope.
		undoManager.setScope( 'postType/wp_template/1' );

		expect( undoManager.hasUndo() ).toBe( true );
		expect( undoManager.hasRedo() ).toBe( false );

		undoManager.undo();

		expect( template.map.get( 'title' ) ).toBeUndefined();
		expect( undoManager.hasRedo() ).toBe( true );
	} );

	it( 'notifies scoped handlers when the scope changes', () => {
		const undoManager = createUndoManager();
		const first = createScopedMap();

		undoManager.addToScope( first.map, first.handlers );
		undoManager.setScope( 'postType/wp_template/1' );

		first.doc.transact( () => {
			first.map.set( 'title', 'Template changed' );
		}, LOCAL_EDITOR_ORIGIN );

		first.handlers.onUndoStackChange.mockClear();

		undoManager.setScope( 'postType/wp_navigation/2' );

		expect( first.handlers.onUndoStackChange ).toHaveBeenCalledWith( {
			hasRedo: false,
			hasUndo: false,
		} );
	} );

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
