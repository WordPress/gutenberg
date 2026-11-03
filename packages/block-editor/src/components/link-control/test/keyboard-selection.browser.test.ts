import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { screen } from '@testing-library/react';
import { SlotFillProvider } from '@wordpress/components';
import { createElement, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import LinkControl from '../';
import { fauxEntitySuggestions, fetchFauxEntitySuggestions } from './fixtures';
import type { LinkControlValue } from '../types';

const mockFetchSearchSuggestions = vi.fn();

vi.mock( import( '@wordpress/data' ), { spy: true } );

vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useReducedMotion: () => true,
} ) );

beforeEach( () => {
	vi.mocked( useDispatch ).mockReturnValue( {
		saveEntityRecords: vi.fn(),
	} );
	vi.mocked( useSelect ).mockImplementation( () => ( {
		fetchSearchSuggestions: mockFetchSearchSuggestions,
		fetchRichUrlData: undefined,
	} ) );
	mockFetchSearchSuggestions.mockImplementation( fetchFauxEntitySuggestions );
} );

describe( 'LinkControl keyboard selection', () => {
	it.each( [
		[
			'entity',
			'hello world',
			fauxEntitySuggestions[ 0 ],
			[
				[ '{ArrowDown}', fauxEntitySuggestions[ 0 ].title ],
				[ '{ArrowDown}', fauxEntitySuggestions[ 1 ].title ],
				[ '{ArrowUp}', fauxEntitySuggestions[ 0 ].title ],
			],
		],
		[
			'url',
			'https://www.wordpress.org',
			{
				title: 'https://www.wordpress.org',
				url: 'https://www.wordpress.org',
			},
			[ [ '{ArrowDown}', 'https://www.wordpress.org' ] ],
		],
	] )(
		'should display a current selected link UI when an %s suggestion for the search "%s" is selected using the keyboard',
		async ( type, searchTerm, selectedLink, selectionSteps ) => {
			const user = userEvent.setup();
			function LinkControlConsumer() {
				const [ link, setLink ] = useState< LinkControlValue >();

				return createElement( LinkControl, {
					value: link,
					onChange: ( suggestion ) => setLink( suggestion ),
				} );
			}

			await render(
				createElement(
					SlotFillProvider,
					null,
					createElement( LinkControlConsumer )
				)
			);

			const searchInput = screen.getByRole( 'combobox', {
				name: 'Search or type URL',
			} );
			// Exercise typing while results for the previous query remain visible.
			const partialSearchTerm = searchTerm.slice( 0, -1 );
			await user.type( searchInput, partialSearchTerm );
			await screen.findByRole( 'listbox', {
				name: `Search results for "${ partialSearchTerm }"`,
			} );
			await user.type( searchInput, searchTerm.slice( -1 ) );

			await screen.findByRole( 'listbox', {
				name: `Search results for "${ searchTerm }"`,
			} );
			const selectedOption = page.getByRole( 'option', {
				selected: true,
			} );

			for ( const [ key, expectedTitle ] of selectionSteps ) {
				await user.keyboard( key );
				await expect
					.element( selectedOption )
					.toHaveTextContent( expectedTitle );
			}

			await user.keyboard( '{Enter}' );

			const selectedLinkName = `${ selectedLink.title } (opens in a new tab)`;
			await expect
				.element( page.getByRole( 'link', { name: selectedLinkName } ) )
				.toHaveFocus();
			await expect
				.element( page.getByRole( 'group', { name: 'Manage link' } ) )
				.toBeVisible();
			await expect
				.element( page.getByRole( 'button', { name: 'Edit link' } ) )
				.toBeVisible();
		}
	);
} );

// Each test starts from a link to "Old Page" (id 99), like a Navigation Link
// bound to that page. A link submitted with a page's `id`, `kind` and `type`
// is a page link (in Navigation, bound to that page); one without them is a
// custom URL (unbound).
describe( 'LinkControl Apply after editing a bound link', () => {
	const boundLink = {
		id: 99,
		kind: 'post-type',
		type: 'page',
		url: 'https://example.com/old-page/',
		title: 'Old Page',
	};
	const pageSuggestion = {
		id: 7,
		title: 'Test Page',
		type: 'page',
		kind: 'post-type',
		url: 'https://example.com/test-page/',
	};

	beforeEach( () => {
		mockFetchSearchSuggestions.mockResolvedValue( [ pageSuggestion ] );
	} );

	async function renderBoundLink( onChange: ( value: unknown ) => void ) {
		await render(
			createElement(
				SlotFillProvider,
				null,
				createElement( LinkControl, {
					value: boundLink,
					onChange,
					forceIsEditingLink: true,
					settings: [],
				} )
			)
		);

		const searchInput = screen.getByRole( 'combobox', {
			name: 'Search or type URL',
		} );
		await userEvent.clear( searchInput );
		return searchInput;
	}

	async function pressApply() {
		await userEvent.click( page.getByRole( 'button', { name: 'Apply' } ) );
	}

	// Bound to "Old Page", switch to "Test Page" with the keyboard.
	// Expected: bound to "Test Page" (id 7, its URL).
	// Bug: stayed bound to "Old Page" (id 99) with "Test Page"'s URL.
	it( 'should submit the suggestion chosen with the arrow keys and Tab', async () => {
		const onChange = vi.fn();
		const searchInput = await renderBoundLink( onChange );

		await userEvent.type( searchInput, 'Test' );
		await screen.findByRole( 'listbox', {
			name: 'Search results for "Test"',
		} );
		await userEvent.keyboard( '{ArrowDown}' );
		await expect
			.element( page.getByRole( 'option', { selected: true } ) )
			.toHaveTextContent( pageSuggestion.title );
		await userEvent.keyboard( '{Tab}{Tab}' );
		await expect
			.element( page.getByRole( 'button', { name: 'Apply' } ) )
			.toHaveFocus();
		await userEvent.keyboard( '{Enter}' );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				id: pageSuggestion.id,
				kind: pageSuggestion.kind,
				type: pageSuggestion.type,
				url: pageSuggestion.url,
			} )
		);
	} );

	// Same as above on a site with plain permalinks, where "Test Page"'s URL is
	// "?p=7". Expected: bound to "Test Page". Bug: "Please enter a valid URL."
	// and nothing saved, since "?p=7" isn't checked as a page link.
	it( 'should submit a suggestion with a plain permalink chosen with the arrow keys and Tab', async () => {
		const plainPermalinkSuggestion = { ...pageSuggestion, url: '?p=7' };
		mockFetchSearchSuggestions.mockResolvedValue( [
			plainPermalinkSuggestion,
		] );
		const onChange = vi.fn();
		const searchInput = await renderBoundLink( onChange );

		await userEvent.type( searchInput, 'Test' );
		await screen.findByRole( 'listbox', {
			name: 'Search results for "Test"',
		} );
		await userEvent.keyboard( '{ArrowDown}{Tab}' );
		await pressApply();

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				id: plainPermalinkSuggestion.id,
				url: plainPermalinkSuggestion.url,
			} )
		);
	} );

	// Bound to "Old Page", type https://wordpress.org by hand.
	// Expected: an unbound custom link to https://wordpress.org.
	// Bug: stayed bound to "Old Page" (id 99) with the typed URL.
	it( 'should submit a typed URL without the previous page', async () => {
		const onChange = vi.fn();
		const searchInput = await renderBoundLink( onChange );

		await userEvent.type( searchInput, 'https://wordpress.org' );
		await pressApply();

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		const [ submitted ] = onChange.mock.calls[ 0 ];
		expect( submitted ).toMatchObject( { url: 'https://wordpress.org' } );
		expect( submitted.id ).toBeUndefined();
		expect( submitted.kind ).toBeUndefined();
		expect( submitted.type ).toBeUndefined();
	} );

	// Bound to "Old Page", Tab to "Test Page", then change your mind and type
	// https://wordpress.org over it. Expected: an unbound custom link to
	// https://wordpress.org, not bound to either page.
	it( 'should submit a typed URL without the suggestion chosen before it', async () => {
		const onChange = vi.fn();
		const searchInput = await renderBoundLink( onChange );

		await userEvent.type( searchInput, 'Test' );
		await screen.findByRole( 'listbox', {
			name: 'Search results for "Test"',
		} );
		await userEvent.keyboard( '{ArrowDown}{Tab}' );
		// Return to the input and replace the chosen URL.
		await userEvent.click( searchInput );
		await userEvent.clear( searchInput );
		await userEvent.type( searchInput, 'https://wordpress.org' );
		await pressApply();

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		const [ submitted ] = onChange.mock.calls[ 0 ];
		expect( submitted ).toMatchObject( { url: 'https://wordpress.org' } );
		expect( submitted.id ).toBeUndefined();
		expect( submitted.kind ).toBeUndefined();
		expect( submitted.type ).toBeUndefined();
	} );
} );

// Typing a character and deleting it leaves the link as it was, so nothing
// should change: not the link, and not whether it's bound.
describe( 'LinkControl after typing back the original URL', () => {
	async function renderAndRetype( value: LinkControlValue ) {
		const onChange = vi.fn();
		await render(
			createElement(
				SlotFillProvider,
				null,
				createElement( LinkControl, {
					value,
					onChange,
					forceIsEditingLink: true,
				} )
			)
		);

		const searchInput = screen.getByRole( 'combobox', {
			name: 'Search or type URL',
		} );
		await userEvent.type( searchInput, 'x{Backspace}' );
		return onChange;
	}

	// An unbound custom link to https://example.com. Type "x", then delete it.
	// Expected: Apply stays disabled and nothing is saved.
	// Regression guard: Apply was enabled and saved an identical link.
	it( 'should keep Apply disabled for a link without a post or page', async () => {
		const onChange = await renderAndRetype( {
			url: 'https://example.com',
			opensInNewTab: false,
		} );

		const applyButton = page.getByRole( 'button', { name: 'Apply' } );
		await expect
			.element( applyButton )
			.toHaveAttribute( 'aria-disabled', 'true' );
		expect( onChange ).not.toHaveBeenCalled();
	} );

	// Bound to "Test Page" with the plain permalink "?p=7". Type "x", delete
	// it, turn on "Open in new tab" and press Apply. Expected: still bound to
	// "Test Page", now opening in a new tab. Regression guard: "Please enter
	// a valid URL." and nothing saved.
	it( 'should apply a page link with a plain permalink without a validation error', async () => {
		const pageLink = {
			id: 7,
			kind: 'post-type',
			type: 'page',
			url: '?p=7',
			title: 'Test Page',
		};
		const onChange = await renderAndRetype( pageLink );

		// Change a setting so that Apply has something to submit.
		await userEvent.click(
			page.getByRole( 'button', { name: 'Advanced' } )
		);
		await userEvent.click(
			page.getByRole( 'checkbox', { name: 'Open in new tab' } )
		);
		await userEvent.click( page.getByRole( 'button', { name: 'Apply' } ) );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { ...pageLink, opensInNewTab: true } )
		);
	} );
} );
