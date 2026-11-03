import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { ReactElement } from 'react';
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlotFillProvider } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import type { useDispatch } from '@wordpress/data';
import { useReducedMotion } from '@wordpress/compose';
import LinkControl from '../';
import { fauxEntitySuggestions, fetchFauxEntitySuggestions } from './fixtures';

globalThis.wpVitest.mockMatchMedia();

const mockFetchSearchSuggestions = vi.fn();
const mockFetchLinkEntity = vi.fn();

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	// The stub stands in for every store's actions.
	useDispatch: ( () => ( {
		saveEntityRecords: vi.fn(),
	} ) ) as unknown as typeof useDispatch,
	useSelect: vi.fn(),
} ) );

vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useReducedMotion: vi.fn( () => true ),
} ) );

// The "About" page, as the editor's lookup finds it.
const ABOUT_PAGE = {
	id: 2,
	url: 'https://example.com/about/',
	title: 'About',
	type: 'page',
	kind: 'post-type',
};

beforeEach( () => {
	( useReducedMotion as Mock ).mockReturnValue( true );
	( useSelect as Mock ).mockImplementation( () => ( {
		fetchSearchSuggestions: mockFetchSearchSuggestions,
		fetchLinkEntity: mockFetchLinkEntity,
	} ) );
	mockFetchSearchSuggestions.mockImplementation( fetchFauxEntitySuggestions );
	mockFetchLinkEntity.mockImplementation( ( url: string ) =>
		Promise.resolve(
			url === 'https://example.com/about/' ? ABOUT_PAGE : null
		)
	);
} );

afterEach( () => {
	mockFetchSearchSuggestions.mockReset();
	mockFetchLinkEntity.mockReset();
} );

function renderWithProvider( ui: ReactElement ) {
	return render( ui, { wrapper: SlotFillProvider } );
}

/**
 * Types a URL into an empty link and waits for the direct entry suggestion.
 *
 * @param url The URL to type.
 */
async function typeUrl( url: string ) {
	const user = userEvent.setup();
	const onChange = vi.fn();
	renderWithProvider(
		<LinkControl forceIsEditingLink onChange={ onChange } />
	);
	const searchInput = screen.getByRole( 'combobox' );
	await user.type( searchInput, url );
	await screen.findByRole( 'option' );
	return { user, onChange, searchInput };
}

describe( 'Binding a typed URL to what it links to on this site', () => {
	it( 'binds a pasted page URL on Apply', async () => {
		// Paste https://example.com/about/ and press Apply: the link is
		// bound to the "About" page, as if it was picked from the results.
		const { user, onChange } = await typeUrl(
			'https://example.com/about/'
		);

		await user.click( screen.getByRole( 'button', { name: 'Apply' } ) );

		await waitFor( () => expect( onChange ).toHaveBeenCalledTimes( 1 ) );
		expect( mockFetchLinkEntity ).toHaveBeenCalledWith(
			'https://example.com/about/'
		);
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				id: 2,
				url: 'https://example.com/about/',
				title: 'About',
				type: 'page',
				kind: 'post-type',
			} )
		);
	} );

	it( 'binds a pasted page URL on Enter', async () => {
		// The same as Apply, from the keyboard.
		const { onChange, searchInput } = await typeUrl(
			'https://example.com/about/'
		);

		fireEvent.keyDown( searchInput, { key: 'Enter', keyCode: 13 } );

		await waitFor( () => expect( onChange ).toHaveBeenCalledTimes( 1 ) );
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				id: 2,
				url: 'https://example.com/about/',
				type: 'page',
				kind: 'post-type',
			} )
		);
	} );

	it( 'saves an unbound link when nothing on the site matches', async () => {
		// https://wordpress.org/ is not a page here, so the link stays a
		// plain custom link, as before.
		const { user, onChange } = await typeUrl( 'https://wordpress.org/' );

		await user.click( screen.getByRole( 'button', { name: 'Apply' } ) );

		await waitFor( () => expect( onChange ).toHaveBeenCalledTimes( 1 ) );
		const saved = onChange.mock.calls[ 0 ][ 0 ];
		expect( saved.url ).toBe( 'https://wordpress.org/' );
		expect( saved.id ).toBeUndefined();
		expect( saved.kind ).toBeUndefined();
	} );

	it( 'saves an unbound link when the lookup fails', async () => {
		mockFetchLinkEntity.mockRejectedValue( new Error( 'Offline' ) );
		const { user, onChange } = await typeUrl(
			'https://example.com/about/'
		);

		await user.click( screen.getByRole( 'button', { name: 'Apply' } ) );

		await waitFor( () => expect( onChange ).toHaveBeenCalledTimes( 1 ) );
		const saved = onChange.mock.calls[ 0 ][ 0 ];
		expect( saved.url ).toBe( 'https://example.com/about/' );
		expect( saved.id ).toBeUndefined();
	} );

	it( 'keeps the popover open, with Apply busy, until the lookup returns', async () => {
		let finishLookup: ( value: unknown ) => void = () => {};
		mockFetchLinkEntity.mockReturnValue(
			new Promise( ( resolve ) => {
				finishLookup = resolve;
			} )
		);
		const { user, onChange } = await typeUrl(
			'https://example.com/about/'
		);
		const apply = screen.getByRole( 'button', { name: 'Apply' } );

		await user.click( apply );

		// Still looking: nothing saved, the input stays and Apply can't be
		// pressed again.
		expect( onChange ).not.toHaveBeenCalled();
		expect( screen.getByRole( 'combobox' ) ).toBeVisible();
		expect( apply ).toHaveAttribute( 'aria-disabled', 'true' );
		await user.click( apply );
		expect( mockFetchLinkEntity ).toHaveBeenCalledTimes( 1 );

		await act( async () => finishLookup( ABOUT_PAGE ) );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { id: 2, kind: 'post-type' } )
		);
	} );

	it( 'rebinds an existing link when a URL of another page is typed in', async () => {
		// The link points at the "Hello" page. Typing the "About" page's URL
		// over it binds it to "About", not to "Hello" with a new URL.
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderWithProvider(
			<LinkControl
				value={ {
					id: 7,
					url: 'https://example.com/hello/',
					title: 'Hello',
					type: 'page',
					kind: 'post-type',
				} }
				forceIsEditingLink
				onChange={ onChange }
			/>
		);
		const searchInput = screen.getByRole( 'combobox' );
		await user.clear( searchInput );
		await user.type( searchInput, 'https://example.com/about/' );

		await user.click( screen.getByRole( 'button', { name: 'Apply' } ) );

		await waitFor( () => expect( onChange ).toHaveBeenCalledTimes( 1 ) );
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				id: 2,
				url: 'https://example.com/about/',
				type: 'page',
				kind: 'post-type',
			} )
		);
	} );

	describe( 'without a lookup', () => {
		it( 'when a bound link is saved with its URL unchanged', async () => {
			// Only the link text changes. The link is already bound, so it
			// saves straight away and keeps its binding.
			const user = userEvent.setup();
			const onChange = vi.fn();
			renderWithProvider(
				<LinkControl
					value={ ABOUT_PAGE }
					forceIsEditingLink
					hasTextControl
					onChange={ onChange }
				/>
			);
			const textInput = screen.getByRole( 'textbox', { name: 'Text' } );
			await user.clear( textInput );
			await user.type( textInput, 'Our story' );

			await user.click( screen.getByRole( 'button', { name: 'Apply' } ) );

			expect( mockFetchLinkEntity ).not.toHaveBeenCalled();
			expect( onChange ).toHaveBeenCalledWith(
				expect.objectContaining( { id: 2, title: 'Our story' } )
			);
		} );

		it( 'when a search result is picked, which brings its own binding', async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			renderWithProvider(
				<LinkControl forceIsEditingLink onChange={ onChange } />
			);
			await user.type( screen.getByRole( 'combobox' ), 'Hello' );

			// A plain click, as hovering scrolls the result into view, which
			// jsdom can't do.
			fireEvent.click(
				await screen.findByRole( 'option', { name: /Hello Page/ } )
			);

			expect( mockFetchLinkEntity ).not.toHaveBeenCalled();
			expect( onChange ).toHaveBeenCalledWith(
				expect.objectContaining( { id: fauxEntitySuggestions[ 0 ].id } )
			);
		} );

		it( 'when the editor provides no lookup', async () => {
			// Outside the WordPress editor there's nothing to look up, and
			// the link saves as it always has.
			( useSelect as Mock ).mockImplementation( () => ( {
				fetchSearchSuggestions: mockFetchSearchSuggestions,
			} ) );
			const { user, onChange } = await typeUrl(
				'https://example.com/about/'
			);

			await user.click( screen.getByRole( 'button', { name: 'Apply' } ) );

			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange.mock.calls[ 0 ][ 0 ].id ).toBeUndefined();
		} );
	} );
} );
