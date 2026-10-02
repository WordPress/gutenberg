import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { RegistryProvider, createRegistry } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';
import SuggestionFormatEdit from '../suggestion-format-edit';
import { ALL_NOTES_SIDEBAR } from '../constants';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

function setup( { sidebarOpen = true } = {} ) {
	const registry = createRegistry();
	registry.register( preferencesStore );
	registry.register( interfaceStore );
	registry.register( editorStore );
	if ( sidebarOpen ) {
		// The interface package is untyped; its store resolves to `any`.
		( registry.dispatch( interfaceStore ) as any ).enableComplementaryArea(
			'core',
			ALL_NOTES_SIDEBAR
		);
	}

	const view = render(
		<RegistryProvider value={ registry }>
			<SuggestionFormatEdit isActive={ false } />
		</RegistryProvider>
	);
	const caretIn = ( id?: string ) =>
		view.rerender(
			<RegistryProvider value={ registry }>
				<SuggestionFormatEdit
					isActive={ !! id }
					activeAttributes={
						id ? { 'data-suggestion-id': id } : undefined
					}
				/>
			</RegistryProvider>
		);
	const { selectNote } = unlock( registry.dispatch( editorStore ) );
	const getSelectedNote = () =>
		unlock( registry.select( editorStore ) ).getSelectedNote();

	return { caretIn, selectNote, getSelectedNote };
}

describe( 'SuggestionFormatEdit', () => {
	it( 'selects the note of the marker under the caret', () => {
		const { caretIn, selectNote, getSelectedNote } = setup();
		selectNote( 1 );
		caretIn( '2' );
		expect( getSelectedNote() ).toBe( 2 );
		caretIn( '1' );
		expect( getSelectedNote() ).toBe( 1 );
	} );

	it( 'deselects when the caret leaves its marker for plain text', () => {
		const { caretIn, getSelectedNote } = setup();
		caretIn( '2' );
		caretIn();
		expect( getSelectedNote() ).toBeUndefined();
	} );

	it( 'keeps a note picked elsewhere when the caret leaves a marker', () => {
		const { caretIn, selectNote, getSelectedNote } = setup();
		caretIn( '2' );
		selectNote( 3 );
		caretIn();
		expect( getSelectedNote() ).toBe( 3 );
	} );

	it( 'leaves a pending focus request alone', () => {
		const { caretIn, selectNote, getSelectedNote } = setup();
		selectNote( 3, { focus: true } );
		caretIn( '2' );
		expect( getSelectedNote() ).toBe( 3 );
	} );

	it( 'does nothing while the notes sidebar is closed', () => {
		const { caretIn, getSelectedNote } = setup( { sidebarOpen: false } );
		caretIn( '2' );
		expect( getSelectedNote() ).toBeUndefined();
	} );
} );
