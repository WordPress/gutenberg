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
		// Cancel comes before Apply in the actions row.
		await userEvent.click( page.getByRole( 'button', { name: 'Apply' } ) );
	}

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
