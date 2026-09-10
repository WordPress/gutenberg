import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { screen, within } from '@testing-library/react';
import { SlotFillProvider } from '@wordpress/components';
import { createElement, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import LinkControl from '../';
import { fauxEntitySuggestions, fetchFauxEntitySuggestions } from './fixtures';

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
	useSelect.mockImplementation( () => ( {
		fetchSearchSuggestions: mockFetchSearchSuggestions,
		fetchRichUrlData: undefined,
	} ) );
	mockFetchSearchSuggestions.mockImplementation( fetchFauxEntitySuggestions );
} );

describe( 'LinkControl keyboard selection', () => {
	it.each( [
		[ 'entity', 'hello world', fauxEntitySuggestions[ 0 ] ],
		[
			'url',
			'https://www.wordpress.org',
			{
				title: 'https://www.wordpress.org',
				url: 'https://www.wordpress.org',
			},
		],
	] )(
		'should display a current selected link UI when an %s suggestion for the search "%s" is selected using the keyboard',
		async ( type, searchTerm, selectedLink ) => {
			const user = userEvent.setup();
			function LinkControlConsumer() {
				const [ link, setLink ] = useState();

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
			await user.type( searchInput, searchTerm );

			const searchResults = await screen.findByRole( 'listbox', {
				name: /Search results for.*/,
			} );
			const searchResultElements =
				within( searchResults ).getAllByRole( 'option' );

			await user.keyboard( '{ArrowDown}' );
			expect( screen.getByRole( 'option', { selected: true } ) ).toBe(
				searchResultElements[ 0 ]
			);

			if ( type === 'entity' ) {
				await user.keyboard( '{ArrowDown}' );
				expect( screen.getByRole( 'option', { selected: true } ) ).toBe(
					searchResultElements[ 1 ]
				);

				await user.keyboard( '{ArrowUp}' );
				expect( screen.getByRole( 'option', { selected: true } ) ).toBe(
					searchResultElements[ 0 ]
				);
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
