import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import {
	fireEvent,
	render,
	screen,
	within,
	waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { useDispatch } from '@wordpress/data';
import { useSelect } from '@wordpress/data';
import { useReducedMotion } from '@wordpress/compose';
import { LinkPicker } from '../';
import type { LinkSuggestionsQuery } from '../../link-control/types';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockScrollIntoView();

/**
 * Presses Enter in an element. `user.keyboard( '[Enter]' )` sends a `keyCode`
 * of `0`, which `URLInput` ignores.
 *
 * @param element Element to press Enter in.
 */
function triggerEnter( element: Element ) {
	fireEvent.keyDown( element, {
		key: 'Enter',
		keyCode: 13,
	} );
}

const mockFetchSearchSuggestions = vi.fn();

// Mock useSelect for search suggestions
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

// Helper to create mock suggestions
function createMockSuggestions( count = 3 ) {
	return Array.from( { length: count }, ( _, i ) => ( {
		id: i + 1,
		title: `Test Page ${ i + 1 }`,
		type: 'page',
		kind: 'post-type',
		url: `https://example.com/page-${ i + 1 }`,
	} ) );
}

// Helper to create mock preview data
function createMockPreview( {
	title = '',
	url = '',
	image = null,
	badges = [],
} = {} ) {
	return {
		title,
		url,
		image,
		badges,
	};
}

beforeEach( () => {
	( useReducedMotion as Mock ).mockReturnValue( true );
	( useSelect as Mock ).mockImplementation( () => ( {
		fetchSearchSuggestions: mockFetchSearchSuggestions,
	} ) );
	mockFetchSearchSuggestions.mockImplementation( () =>
		Promise.resolve( createMockSuggestions() )
	);
} );

afterEach( () => {
	mockFetchSearchSuggestions.mockReset();
} );

describe( 'LinkPicker', () => {
	describe( 'Basic rendering', () => {
		it( 'should render a button with "Add link" text when no link is provided', () => {
			render(
				<LinkPicker
					preview={ createMockPreview() }
					onSelect={ vi.fn() }
					label="Link"
				/>
			);

			const button = screen.getByRole( 'button', {
				name: /add link/i,
			} );

			expect( button ).toBeVisible();
		} );

		it( 'should render a button with URL when link is provided', () => {
			render(
				<LinkPicker
					preview={ {
						url: 'example.com',
						badges: [],
					} }
					onSelect={ vi.fn() }
					label="Link"
				/>
			);

			const button = screen.getByRole( 'button' );

			expect( button ).toBeVisible();
			expect( button ).toHaveTextContent( 'example.com' );
		} );

		it( 'should render a button with title when provided', () => {
			render(
				<LinkPicker
					preview={ {
						title: 'My Page',
						url: 'example.com',
						badges: [ { label: 'Page', intent: 'none' } ],
					} }
					onSelect={ vi.fn() }
					label="Link"
				/>
			);

			const button = screen.getByRole( 'button' );

			expect( button ).toBeVisible();
			expect( button ).toHaveTextContent( 'My Page' );
		} );

		it( 'should render featured image when provided', () => {
			render(
				<LinkPicker
					preview={ {
						title: 'My Page',
						url: 'example.com',
						image: 'https://example.com/image.jpg',
						badges: [ { label: 'Page', intent: 'none' } ],
					} }
					onSelect={ vi.fn() }
					label="Link"
				/>
			);

			const button = screen.getByRole( 'button' );
			const image = within( button ).getByRole( 'presentation', {
				hidden: true,
			} );

			expect( image ).toHaveAttribute(
				'src',
				'https://example.com/image.jpg'
			);
		} );

		it( 'should render label for the control', () => {
			render(
				<LinkPicker
					preview={ createMockPreview( { url: 'example.com' } ) }
					onSelect={ vi.fn() }
					label="Link to"
				/>
			);

			expect( screen.getByText( 'Link to' ) ).toBeVisible();
		} );

		it( 'should render help text when provided', () => {
			render(
				<LinkPicker
					preview={ createMockPreview( { url: 'example.com' } ) }
					onSelect={ vi.fn() }
					label="Link"
					help="Synced with the selected page."
				/>
			);

			expect(
				screen.getByText( 'Synced with the selected page.' )
			).toBeVisible();
		} );
	} );

	describe( 'Dropdown interaction', () => {
		it( 'should open dropdown when button is clicked', async () => {
			const user = userEvent.setup();

			render(
				<LinkPicker
					preview={ createMockPreview( { url: 'example.com' } ) }
					onSelect={ vi.fn() }
					label="Link"
				/>
			);

			const button = screen.getByRole( 'button' );

			// Dropdown should not be visible initially
			expect(
				screen.queryByRole( 'combobox', { name: 'Search or type URL' } )
			).not.toBeInTheDocument();

			// Click the button
			await user.click( button );

			// Dropdown should now be visible
			expect(
				screen.getByRole( 'combobox', { name: 'Search or type URL' } )
			).toBeVisible();
		} );

		it( 'should have proper aria attributes when dropdown is open', async () => {
			const user = userEvent.setup();

			render(
				<LinkPicker
					preview={ createMockPreview( { url: 'example.com' } ) }
					onSelect={ vi.fn() }
					label="Link"
				/>
			);

			const button = screen.getByRole( 'button' );

			// Initially aria-expanded should be false
			expect( button ).toHaveAttribute( 'aria-expanded', 'false' );
			expect( button ).toHaveAttribute( 'aria-haspopup', 'dialog' );

			// Click to open
			await user.click( button );

			// After opening, aria-expanded should be true
			expect( button ).toHaveAttribute( 'aria-expanded', 'true' );
		} );

		it( 'should close dropdown when preview button is clicked again', async () => {
			const user = userEvent.setup();

			render(
				<LinkPicker
					preview={ createMockPreview( { url: 'example.com' } ) }
					onSelect={ vi.fn() }
					label="Link"
				/>
			);

			const button = screen.getByRole( 'button' );

			// Click to open
			await user.click( button );
			expect( button ).toHaveAttribute( 'aria-expanded', 'true' );

			// Verify dropdown content is visible
			const searchInput = await screen.findByRole( 'combobox', {
				name: 'Search or type URL',
			} );
			expect( searchInput ).toBeVisible();

			// Click the preview button again to close
			await user.click( button );

			// After clicking again, aria-expanded should be false
			await waitFor( () => {
				expect( button ).toHaveAttribute( 'aria-expanded', 'false' );
			} );

			// Search input should no longer be visible
			expect(
				screen.queryByRole( 'combobox', {
					name: 'Search or type URL',
				} )
			).not.toBeInTheDocument();
		} );

		it( 'should display help text when provided', () => {
			render(
				<LinkPicker
					preview={ createMockPreview( { url: 'example.com' } ) }
					onSelect={ vi.fn() }
					label="Link"
					help="This is help text"
				/>
			);

			const button = screen.getByRole( 'button' );
			const helpText = screen.getByText( 'This is help text' );
			// Help text should be visible
			expect( helpText ).toBeVisible();

			// Button should have aria-describedby for accessibility
			expect( button ).toHaveAttribute( 'aria-describedby' );
			// Button aria-describedby should match the ID of the description element
			expect( button ).toHaveAttribute( 'aria-describedby', helpText.id );
		} );

		it( 'should not have aria-describedby when help is not provided', () => {
			render(
				<LinkPicker
					preview={ createMockPreview( { url: 'example.com' } ) }
					onSelect={ vi.fn() }
					label="Link"
				/>
			);

			const button = screen.getByRole( 'button' );

			// Button should NOT have aria-describedby when no help text
			expect( button ).not.toHaveAttribute( 'aria-describedby' );
		} );
	} );

	describe( 'Selection behavior', () => {
		it( 'should call onSelect with suggestion data when a suggestion is selected', async () => {
			const user = userEvent.setup();
			const onSelect = vi.fn();

			render(
				<LinkPicker
					preview={ createMockPreview() }
					onSelect={ onSelect }
					label="Link"
				/>
			);

			// Open the dropdown
			const button = screen.getByRole( 'button' );
			await user.click( button );

			// Wait for search input to be visible
			const searchInput = await screen.findByRole( 'combobox', {
				name: 'Search or type URL',
			} );

			// Type to search
			await user.type( searchInput, 'Test' );

			// Wait for suggestions to appear
			const suggestionsList = await screen.findByRole( 'listbox' );
			expect( suggestionsList ).toBeVisible();

			// Click on the first suggestion
			const suggestions =
				within( suggestionsList ).getAllByRole( 'option' );
			await user.click( suggestions[ 0 ] );

			// Verify onSelect was called with correct data
			expect( onSelect ).toHaveBeenCalledWith(
				expect.objectContaining( {
					url: expect.any( String ),
					kind: 'post-type',
					type: 'page',
					id: 1,
					title: 'Test Page 1',
				} )
			);
		} );

		it( 'should close dropdown after selecting a suggestion', async () => {
			const user = userEvent.setup();

			render(
				<LinkPicker
					preview={ createMockPreview() }
					onSelect={ vi.fn() }
					label="Link"
				/>
			);

			// Open the dropdown
			const button = screen.getByRole( 'button' );
			await user.click( button );

			// Wait for search input
			const searchInput = await screen.findByRole( 'combobox', {
				name: 'Search or type URL',
			} );

			// Type to search
			await user.type( searchInput, 'Test' );

			// Wait for suggestions and click first one
			const suggestionsList = await screen.findByRole( 'listbox' );
			const suggestions =
				within( suggestionsList ).getAllByRole( 'option' );
			await user.click( suggestions[ 0 ] );

			// Dropdown should be closed
			expect(
				screen.queryByRole( 'combobox', { name: 'Search or type URL' } )
			).not.toBeInTheDocument();

			// Focus should return to the button
			expect( button ).toHaveFocus();
		} );
	} );

	describe( 'Suggestions query', () => {
		it( 'should accept suggestionsQuery prop for filtering', async () => {
			const user = userEvent.setup();
			const customQuery: LinkSuggestionsQuery = {
				type: 'post',
				subtype: 'page',
			};

			render(
				<LinkPicker
					preview={ createMockPreview() }
					onSelect={ vi.fn() }
					suggestionsQuery={ customQuery }
					label="Link"
				/>
			);

			// Open the dropdown
			const button = screen.getByRole( 'button' );
			await user.click( button );

			// Wait for search input
			const searchInput = await screen.findByRole( 'combobox', {
				name: 'Search or type URL',
			} );

			// Type to trigger search
			await user.type( searchInput, 'Test' );

			// Wait for the mock to be called
			await waitFor( () => {
				expect( mockFetchSearchSuggestions ).toHaveBeenCalled();
			} );

			// The suggestionsQuery prop is passed through to LinkControl
			// which uses it to filter search results
		} );

		it( 'should show suggestions added by transformSuggestions before anything is typed', async () => {
			const user = userEvent.setup();
			const onSelect = vi.fn();

			render(
				<LinkPicker
					preview={ createMockPreview() }
					onSelect={ onSelect }
					transformSuggestions={ ( suggestions ) => [
						{
							id: 'media',
							title: 'Media file',
							url: 'https://example.com/image.jpg',
						},
						...suggestions,
					] }
					label="Link"
				/>
			);

			await user.click( screen.getByRole( 'button' ) );

			const suggestionsList = await screen.findByRole( 'listbox' );
			const suggestions =
				within( suggestionsList ).getAllByRole( 'option' );
			expect( suggestions[ 0 ] ).toHaveTextContent( 'Media file' );
			expect( suggestions[ 1 ] ).toHaveTextContent( 'Test Page 1' );

			await user.click( suggestions[ 0 ] );

			expect( onSelect ).toHaveBeenCalledWith(
				expect.objectContaining( {
					url: 'https://example.com/image.jpg',
					title: 'Media file',
				} )
			);
		} );
	} );

	describe( 'Plain URL mode', () => {
		it( 'should ask for a URL instead of a search', async () => {
			const user = userEvent.setup();

			render(
				<LinkPicker
					preview={ createMockPreview() }
					onSelect={ vi.fn() }
					label="Link"
					showSuggestions={ false }
				/>
			);

			await user.click( screen.getByRole( 'button' ) );

			expect(
				await screen.findByRole( 'combobox', {
					name: 'Paste or type URL',
				} )
			).toBeVisible();
		} );

		it( 'should not search for suggestions', async () => {
			const user = userEvent.setup();

			render(
				<LinkPicker
					preview={ createMockPreview() }
					onSelect={ vi.fn() }
					label="Link"
					showSuggestions={ false }
				/>
			);

			await user.click( screen.getByRole( 'button' ) );
			const urlInput = await screen.findByRole( 'combobox', {
				name: 'Paste or type URL',
			} );
			await user.type( urlInput, 'Test' );

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
			expect( mockFetchSearchSuggestions ).not.toHaveBeenCalled();
		} );

		it( 'should select the typed URL when Enter is pressed', async () => {
			const user = userEvent.setup();
			const onSelect = vi.fn();

			render(
				<LinkPicker
					preview={ createMockPreview() }
					onSelect={ onSelect }
					label="Link"
					showSuggestions={ false }
				/>
			);

			const button = screen.getByRole( 'button' );
			await user.click( button );
			const urlInput = await screen.findByRole( 'combobox', {
				name: 'Paste or type URL',
			} );
			await user.type( urlInput, 'https://wordpress.org' );
			triggerEnter( urlInput );

			expect( onSelect ).toHaveBeenCalledTimes( 1 );
			expect( onSelect ).toHaveBeenCalledWith(
				expect.objectContaining( { url: 'https://wordpress.org' } )
			);
			expect(
				screen.queryByRole( 'combobox', {
					name: 'Paste or type URL',
				} )
			).not.toBeInTheDocument();
			expect( button ).toHaveFocus();
		} );
	} );

	describe( 'Integration scenarios', () => {
		it( 'should handle changing from empty link to entity link', async () => {
			const user = userEvent.setup();
			const onSelect = vi.fn();

			render(
				<LinkPicker
					preview={ createMockPreview() }
					onSelect={ onSelect }
					label="Link"
				/>
			);

			// Open and select a page
			await user.click( screen.getByRole( 'button' ) );
			const searchInput = await screen.findByRole( 'combobox', {
				name: 'Search or type URL',
			} );
			await user.type( searchInput, 'Test' );

			const suggestionsList = await screen.findByRole( 'listbox' );
			const suggestions =
				within( suggestionsList ).getAllByRole( 'option' );
			await user.click( suggestions[ 0 ] );

			// Verify entity link data was passed
			expect( onSelect ).toHaveBeenCalledWith(
				expect.objectContaining( {
					kind: 'post-type',
					type: 'page',
					id: expect.any( Number ),
				} )
			);
		} );
	} );
} );
