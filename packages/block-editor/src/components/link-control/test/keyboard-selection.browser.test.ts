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
const mockFetchLinkEntity = vi.fn();

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
		fetchLinkEntity: mockFetchLinkEntity,
	} ) );
	mockFetchSearchSuggestions.mockImplementation( fetchFauxEntitySuggestions );
	mockFetchLinkEntity.mockReset();
	mockFetchLinkEntity.mockResolvedValue( null );
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

	it( 'binds a result chosen with the Tab key and saved with Apply', async () => {
		// Arrow down to the "Hello Page" result and press Tab: that fills
		// in its URL, without picking the result. Apply then finds the page
		// from its URL, and the link saves bound to it, as if it was picked.
		const helloPage = {
			id: 2,
			title: 'Hello Page',
			type: 'page',
			url: 'https://example.com/hello-page/',
		};
		mockFetchSearchSuggestions.mockResolvedValue( [ helloPage ] );
		mockFetchLinkEntity.mockResolvedValue( {
			...helloPage,
			kind: 'post-type',
		} );
		const user = userEvent.setup();
		const onChange = vi.fn();
		await render(
			createElement(
				SlotFillProvider,
				null,
				createElement( LinkControl, {
					forceIsEditingLink: true,
					onChange,
				} )
			)
		);
		const searchInput = screen.getByRole( 'combobox', {
			name: 'Search or type URL',
		} );
		await user.type( searchInput, 'Hello' );
		await screen.findByRole( 'listbox', {
			name: 'Search results for "Hello"',
		} );

		await user.keyboard( '{ArrowDown}' );
		await user.keyboard( '{Tab}' );
		await expect.element( searchInput ).toHaveValue( helloPage.url );
		await page.getByRole( 'button', { name: 'Apply' } ).click();

		await expect.poll( () => onChange.mock.calls.length ).toBe( 1 );
		expect( mockFetchLinkEntity ).toHaveBeenCalledWith( helloPage.url );
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				id: helloPage.id,
				type: 'page',
				kind: 'post-type',
			} )
		);
	} );
} );
