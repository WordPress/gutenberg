import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as interfaceStore } from '@wordpress/interface';
import { isAppleOS } from '@wordpress/keycodes';
import {
	ShortcutProvider,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as blockEditorStore } from '../../../../../block-editor/src/store';
import EditorKeyboardShortcuts from '..';
import {
	SaveShortcutContext,
	type SaveShortcutHandlerRef,
} from '../save-shortcut-context';
import { store as editorStore } from '../../../store';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

type SetupOptions = {
	dirty?: boolean;
	locked?: boolean;
	savingOtherEntities?: boolean;
	handlerRef?: SaveShortcutHandlerRef | null;
	name?: string;
};

function setup( {
	dirty = false,
	locked = false,
	savingOtherEntities = false,
	handlerRef = null,
	name = 'Editor keyboard target',
}: SetupOptions = {} ) {
	const registry = createRegistry();
	registry.register( preferencesStore );
	registry.register( coreStore );
	registry.register( blockEditorStore );
	registry.register( interfaceStore );
	registry.register( editorStore );
	registry.register( keyboardShortcutsStore );

	// Keep the real registry and keyboard matching. Only the editor conditions
	// and the persistence side effect are controlled by these component tests.
	const selectors = registry.select( editorStore );
	vi.spyOn( selectors, 'getEditorSettings' ).mockReturnValue( {
		richEditingEnabled: true,
		codeEditingEnabled: true,
	} );
	vi.spyOn( selectors, 'isEditedPostDirty' ).mockReturnValue( dirty );
	vi.spyOn( selectors, 'isPostSavingLocked' ).mockReturnValue( locked );
	vi.spyOn( selectors, 'isSavingNonPostEntityChanges' ).mockReturnValue(
		savingOtherEntities
	);
	vi.spyOn( selectors, 'getEditorMode' ).mockReturnValue( 'visual' );
	const actions = registry.dispatch( editorStore );
	const savePost = vi
		.spyOn( actions, 'savePost' )
		.mockImplementation( vi.fn() );
	const switchEditorMode = vi
		.spyOn( actions, 'switchEditorMode' )
		.mockImplementation( vi.fn() );

	for ( const [ shortcut, character ] of [
		[ 'save', 's' ],
		[ 'toggle-mode', 'm' ],
	] as const ) {
		registry.dispatch( keyboardShortcutsStore ).registerShortcut( {
			name: `core/editor/${ shortcut }`,
			category: 'global',
			description: shortcut,
			keyCombination: { modifier: 'primary', character },
		} );
	}

	render(
		<RegistryProvider value={ registry }>
			<SaveShortcutContext.Provider value={ handlerRef }>
				<ShortcutProvider>
					<EditorKeyboardShortcuts />
					<button>{ name }</button>
				</ShortcutProvider>
			</SaveShortcutContext.Provider>
		</RegistryProvider>
	);

	const target = screen.getByRole( 'button', { name } );
	const press = ( character = 's' ) =>
		fireEvent.keyDown( target, {
			key: character,
			code: `Key${ character.toUpperCase() }`,
			ctrlKey: ! isAppleOS(),
			metaKey: isAppleOS(),
			bubbles: true,
			cancelable: true,
		} );

	return { press, savePost, switchEditorMode };
}

describe( 'EditorKeyboardShortcuts save handoff', () => {
	it( 'lets the containing editor handle Save when only another entity is dirty', () => {
		const handler = vi.fn( () => true );
		const { press, savePost } = setup( {
			handlerRef: { current: handler },
		} );

		expect( press() ).toBe( false );
		expect( handler ).toHaveBeenCalledExactlyOnceWith();
		expect( savePost ).not.toHaveBeenCalled();
	} );

	it( 'does not save the dirty post separately when the containing editor handles Save', () => {
		const handler = vi.fn( () => true );
		const { press, savePost } = setup( {
			dirty: true,
			handlerRef: { current: handler },
		} );

		press();

		expect( handler ).toHaveBeenCalledExactlyOnceWith();
		expect( savePost ).not.toHaveBeenCalled();
	} );

	it( 'saves the dirty post when the containing editor declines the handoff', () => {
		const handler = vi.fn( () => false );
		const { press, savePost } = setup( {
			dirty: true,
			handlerRef: { current: handler },
		} );

		press();

		expect( handler ).toHaveBeenCalledExactlyOnceWith();
		expect( savePost ).toHaveBeenCalledExactlyOnceWith();
	} );

	it( 'does not save a clean post when the handoff is declined', () => {
		const handler = vi.fn( () => false );
		const { press, savePost } = setup( {
			handlerRef: { current: handler },
		} );

		press();

		expect( handler ).toHaveBeenCalledExactlyOnceWith();
		expect( savePost ).not.toHaveBeenCalled();
	} );

	it( 'does nothing for a clean standalone editor', () => {
		const { press, savePost } = setup();

		expect( press() ).toBe( false );
		expect( savePost ).not.toHaveBeenCalled();
	} );

	it( 'keeps saving a dirty standalone editor', () => {
		const { press, savePost } = setup( { dirty: true } );

		press();

		expect( savePost ).toHaveBeenCalledExactlyOnceWith();
	} );

	it( 'keeps saving when a containing editor has not registered a handler', () => {
		const { press, savePost } = setup( {
			dirty: true,
			handlerRef: { current: null },
		} );

		press();

		expect( savePost ).toHaveBeenCalledExactlyOnceWith();
	} );

	it.each( [
		{ locked: true, savingOtherEntities: false },
		{ locked: false, savingOtherEntities: true },
	] )(
		'does not delegate or save while saving is blocked: %o',
		( conditions ) => {
			const handler = vi.fn( () => true );
			const { press, savePost } = setup( {
				...conditions,
				dirty: true,
				handlerRef: { current: handler },
			} );

			expect( press() ).toBe( false );
			expect( handler ).not.toHaveBeenCalled();
			expect( savePost ).not.toHaveBeenCalled();
		}
	);

	it( 'uses the current handler without requiring the shortcut component to remount', () => {
		const previousHandler = vi.fn( () => true );
		const currentHandler = vi.fn( () => true );
		const handlerRef = { current: previousHandler };
		const { press, savePost } = setup( { handlerRef } );
		handlerRef.current = currentHandler;

		press();

		expect( previousHandler ).not.toHaveBeenCalled();
		expect( currentHandler ).toHaveBeenCalledExactlyOnceWith();
		expect( savePost ).not.toHaveBeenCalled();
	} );

	it( 'keeps the Save handler scoped to its containing editor', () => {
		const firstHandler = vi.fn( () => true );
		const secondHandler = vi.fn( () => true );
		const first = setup( {
			name: 'First editor',
			handlerRef: { current: firstHandler },
		} );
		const second = setup( {
			name: 'Second editor',
			handlerRef: { current: secondHandler },
		} );

		first.press();

		expect( firstHandler ).toHaveBeenCalledExactlyOnceWith();
		expect( secondHandler ).not.toHaveBeenCalled();
		expect( first.savePost ).not.toHaveBeenCalled();
		expect( second.savePost ).not.toHaveBeenCalled();
	} );

	it( 'does not delegate a different keyboard shortcut to the Save handler', () => {
		const handler = vi.fn( () => true );
		const { press, savePost, switchEditorMode } = setup( {
			handlerRef: { current: handler },
		} );

		press( 'm' );

		expect( handler ).not.toHaveBeenCalled();
		expect( savePost ).not.toHaveBeenCalled();
		expect( switchEditorMode ).toHaveBeenCalledExactlyOnceWith( 'text' );
	} );
} );
