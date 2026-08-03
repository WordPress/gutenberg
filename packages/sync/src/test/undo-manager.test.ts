/**
 * External dependencies
 */
import * as Y from 'yjs';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

/**
 * WordPress dependencies
 */
import {
	createUndoManager as createWPUndoManager,
	type HistoryRecord,
} from '@wordpress/undo-manager';

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

	function createScopedMap( objectId = String( docs.length + 1 ) ) {
		const doc = new Y.Doc();
		docs.push( doc );
		return {
			doc,
			map: doc.getMap( 'record' ),
			objectId,
			handlers: {
				addUndoMeta: jest.fn(),
				onUndoStackChange: jest.fn(),
				restoreUndoMeta: jest.fn(),
			},
		};
	}

	function createRecord(
		id: string | Record< string, unknown >,
		from: unknown,
		to: unknown
	): HistoryRecord< any > {
		return [ { id, changes: { title: { from, to } } } ];
	}

	function addScopedMap(
		undoManager: ReturnType< typeof createUndoManager >,
		scope: ReturnType< typeof createScopedMap >
	) {
		undoManager.addToScope(
			scope.map,
			'postType/post',
			scope.objectId,
			scope.handlers
		);
	}

	function addSyncRecord(
		undoManager: ReturnType< typeof createUndoManager >,
		scope: ReturnType< typeof createScopedMap >,
		value: string
	) {
		const previousValue = scope.map.get( 'title' );
		scope.doc.transact( () => {
			scope.map.set( 'title', value );
		}, LOCAL_EDITOR_ORIGIN );
		undoManager.addRecord(
			createRecord(
				{
					kind: 'postType',
					name: 'post',
					recordId: scope.objectId,
				},
				previousValue,
				value
			)
		);
	}

	it( 'notifies scoped handlers when the Yjs undo stack changes', () => {
		const undoManager = createUndoManager();
		const first = createScopedMap();
		const second = createScopedMap();

		addScopedMap( undoManager, first );
		addScopedMap( undoManager, second );

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

	it( 'only runs metadata handlers for the document that created the stack item', () => {
		const undoManager = createUndoManager();
		const first = createScopedMap();
		const second = createScopedMap();

		addScopedMap( undoManager, first );
		addScopedMap( undoManager, second );

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

	it( 'uses the fallback history for non-synced entity records', () => {
		const undoManager = createUndoManager();
		const record = createRecord(
			{ kind: 'root', name: 'note', recordId: '1' },
			'Before',
			'After'
		);

		undoManager.addRecord( record );

		expect( undoManager.hasUndo() ).toBe( true );
		expect( undoManager.undo() ).toEqual( record );
		expect( undoManager.hasRedo() ).toBe( true );
		expect( undoManager.redo() ).toEqual( record );
	} );

	it( 'retains fallback history created before syncing starts', () => {
		const fallbackUndoManager = createWPUndoManager();
		const record = createRecord(
			{ kind: 'root', name: 'note', recordId: '1' },
			'Before',
			'After'
		);
		fallbackUndoManager.addRecord( record );

		const undoManager = createUndoManager();
		undoManager.setFallbackUndoManager( fallbackUndoManager );

		expect( undoManager.hasUndo() ).toBe( true );
		expect( undoManager.undo() ).toEqual( record );
	} );

	it( 'orders existing fallback history with new synced history', () => {
		const fallbackUndoManager = createWPUndoManager();
		const fallbackRecord = createRecord(
			{ kind: 'root', name: 'note', recordId: '1' },
			'Before',
			'After'
		);
		fallbackUndoManager.addRecord( fallbackRecord );

		const undoManager = createUndoManager();
		const synced = createScopedMap();
		undoManager.setFallbackUndoManager( fallbackUndoManager );
		addScopedMap( undoManager, synced );
		addSyncRecord( undoManager, synced, 'Synced' );

		expect( undoManager.undo() ).toEqual( [] );
		expect( undoManager.undo() ).toEqual( fallbackRecord );
		expect( undoManager.redo() ).toEqual( fallbackRecord );
		expect( synced.map.get( 'title' ) ).toBeUndefined();
		expect( undoManager.redo() ).toEqual( [] );
		expect( synced.map.get( 'title' ) ).toBe( 'Synced' );
	} );

	it( 'preserves chronology between synced and non-synced records', () => {
		const undoManager = createUndoManager();
		const synced = createScopedMap();
		const fallbackRecord = createRecord(
			{ kind: 'root', name: 'note', recordId: '1' },
			'Before',
			'After'
		);
		addScopedMap( undoManager, synced );

		addSyncRecord( undoManager, synced, 'Synced' );
		undoManager.addRecord( fallbackRecord );

		expect( undoManager.undo() ).toEqual( fallbackRecord );
		expect( synced.map.get( 'title' ) ).toBe( 'Synced' );
		expect( undoManager.undo() ).toEqual( [] );
		expect( synced.map.get( 'title' ) ).toBeUndefined();

		expect( undoManager.redo() ).toEqual( [] );
		expect( synced.map.get( 'title' ) ).toBe( 'Synced' );
		expect( undoManager.redo() ).toEqual( fallbackRecord );
	} );

	it( 'starts a new synced undo level after a fallback record', () => {
		const undoManager = createUndoManager();
		const synced = createScopedMap();
		const fallbackRecord = createRecord(
			{ kind: 'root', name: 'note', recordId: '1' },
			'Before',
			'After'
		);
		addScopedMap( undoManager, synced );

		addSyncRecord( undoManager, synced, 'First' );
		undoManager.addRecord( fallbackRecord );
		addSyncRecord( undoManager, synced, 'Second' );

		expect( undoManager.undo() ).toEqual( [] );
		expect( synced.map.get( 'title' ) ).toBe( 'First' );
		expect( undoManager.undo() ).toEqual( fallbackRecord );
		expect( undoManager.undo() ).toEqual( [] );
		expect( synced.map.get( 'title' ) ).toBeUndefined();
	} );
} );
