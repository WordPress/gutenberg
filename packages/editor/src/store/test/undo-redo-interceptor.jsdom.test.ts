import { describe, expect, it, vi } from 'vitest';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createReduxStore, createRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as editorStore } from '..';
import { setUndoRedoInterceptor } from '../undo-redo-interceptor';

vi.hoisted( () => ( globalThis as any ).wpVitest.mockMatchMedia() );

/**
 * Two editors in sub-registries over one core-data store, whose `undo` and
 * `redo` are spies.
 *
 * @return The spies and the two editors' registries.
 */
function setupTwoEditors() {
	const undo = vi.fn( () => ( { type: 'UNDO' } ) );
	const redo = vi.fn( () => ( { type: 'REDO' } ) );
	const parent: any = createRegistry();
	parent.register(
		createReduxStore( 'core', {
			reducer: ( state = {} ) => state,
			actions: { undo, redo },
		} )
	);
	parent.register( noticesStore );
	parent.register( preferencesStore );
	const makeEditor = () => {
		const registry: any = createRegistry( {}, parent );
		registry.register( blockEditorStore );
		registry.register( editorStore );
		return registry;
	};
	return { undo, redo, first: makeEditor(), second: makeEditor() };
}

describe( 'undo and redo interceptor', () => {
	it( 'runs ahead of the undo and redo of its own editor only', () => {
		const { undo, redo, first, second } = setupTwoEditors();
		const firstInterceptor = { undo: vi.fn(), redo: vi.fn() };
		const secondInterceptor = { undo: vi.fn(), redo: vi.fn() };
		setUndoRedoInterceptor( first, firstInterceptor );
		setUndoRedoInterceptor( second, secondInterceptor );

		first.dispatch( editorStore ).undo();
		second.dispatch( editorStore ).redo();

		expect( firstInterceptor.undo ).toHaveBeenCalledTimes( 1 );
		expect( firstInterceptor.redo ).not.toHaveBeenCalled();
		expect( secondInterceptor.redo ).toHaveBeenCalledTimes( 1 );
		expect( secondInterceptor.undo ).not.toHaveBeenCalled();
		// Neither consumed it, so both reached core-data.
		expect( undo ).toHaveBeenCalledTimes( 1 );
		expect( redo ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps a consumed undo or redo from core-data', () => {
		const { undo, redo, first } = setupTwoEditors();
		setUndoRedoInterceptor( first, {
			undo: () => true,
			redo: () => true,
		} );

		first.dispatch( editorStore ).undo();
		first.dispatch( editorStore ).redo();

		expect( undo ).not.toHaveBeenCalled();
		expect( redo ).not.toHaveBeenCalled();
	} );

	it( 'removes only the interceptor it set', () => {
		const { undo, first } = setupTwoEditors();
		const removeEarlier = setUndoRedoInterceptor( first, {
			undo: () => false,
		} );
		const later = { undo: vi.fn( () => true ) };
		const removeLater = setUndoRedoInterceptor( first, later );

		// Removed out of order: the later interceptor stays.
		removeEarlier();
		first.dispatch( editorStore ).undo();
		expect( later.undo ).toHaveBeenCalledTimes( 1 );
		expect( undo ).not.toHaveBeenCalled();

		removeLater();
		first.dispatch( editorStore ).undo();
		expect( later.undo ).toHaveBeenCalledTimes( 1 );
		expect( undo ).toHaveBeenCalledTimes( 1 );
	} );
} );
