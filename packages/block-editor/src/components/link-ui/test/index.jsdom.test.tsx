import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlotFillProvider } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useReducedMotion } from '@wordpress/compose';
import { LinkUI } from '../';

globalThis.wpVitest.mockMatchMedia();

const mockFetchSearchSuggestions = vi.fn();
const mockCreateSuccessNotice = vi.fn();
const mockCreateErrorNotice = vi.fn();

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	// The stub stands in for every store's actions.
	useDispatch: vi.fn(),
	useSelect: vi.fn(),
} ) );

vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useReducedMotion: vi.fn( () => true ),
} ) );

const createdPage = {
	id: 5,
	type: 'page',
	kind: 'post-type',
	title: 'New Page',
	url: 'https://example.com/new-page',
};

function getSearchInput() {
	return screen.getByRole( 'combobox', { name: 'Search or type URL' } );
}

beforeEach( () => {
	( useReducedMotion as Mock ).mockReturnValue( true );
	( useSelect as Mock ).mockImplementation( () => ( {
		fetchSearchSuggestions: mockFetchSearchSuggestions,
	} ) );
	( useDispatch as Mock ).mockImplementation( () => ( {
		createSuccessNotice: mockCreateSuccessNotice,
		createErrorNotice: mockCreateErrorNotice,
	} ) );
	mockFetchSearchSuggestions.mockImplementation( () =>
		Promise.resolve( [] )
	);
} );

afterEach( () => {
	mockFetchSearchSuggestions.mockReset();
	mockCreateSuccessNotice.mockReset();
	mockCreateErrorNotice.mockReset();
} );

describe( 'LinkUI', () => {
	it( 'suggests the link’s own type before anything is typed', async () => {
		render(
			<LinkUI
				link={ { type: 'post', kind: 'post-type' } }
				onChange={ vi.fn() }
				onClose={ vi.fn() }
			/>
		);

		await waitFor( () =>
			expect( mockFetchSearchSuggestions ).toHaveBeenCalled()
		);
		expect( mockFetchSearchSuggestions ).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining( {
				isInitialSuggestions: true,
				initialSuggestionsSearchOptions: {
					type: 'post',
					subtype: 'post',
					perPage: 20,
				},
				preferTypes: [ { type: 'post', subtype: 'post' } ],
			} )
		);
	} );

	it( 'uses the suggestions query it is given', async () => {
		render(
			<LinkUI
				link={ {} }
				suggestionsQuery={ {
					initialSuggestionsSearchOptions: {
						type: 'post',
						perPage: 5,
					},
				} }
				onChange={ vi.fn() }
				onClose={ vi.fn() }
			/>
		);

		await waitFor( () =>
			expect( mockFetchSearchSuggestions ).toHaveBeenCalled()
		);
		const query = mockFetchSearchSuggestions.mock.calls[ 0 ][ 1 ];
		expect( query.initialSuggestionsSearchOptions ).toEqual( {
			type: 'post',
			perPage: 5,
		} );
		expect( query ).not.toHaveProperty( 'preferTypes' );
	} );

	it( 'offers page creation only when the consumer can create pages', () => {
		const { rerender } = render(
			<LinkUI link={ {} } onChange={ vi.fn() } onClose={ vi.fn() } />
		);

		expect(
			screen.queryByRole( 'button', { name: 'Create page' } )
		).not.toBeInTheDocument();

		rerender(
			<LinkUI
				link={ {} }
				onCreatePage={ vi.fn() }
				onChange={ vi.fn() }
				onClose={ vi.fn() }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Create page' } )
		).toBeVisible();
	} );

	it( 'hides the tools once a link is set', () => {
		render(
			// The preview fills a slot.
			<SlotFillProvider>
				<LinkUI
					link={ {
						url: 'https://example.com/about',
						title: 'About',
					} }
					onCreatePage={ vi.fn() }
					tools={ [
						{
							id: 'blocks',
							label: 'Add block',
							render: () => null,
						},
					] }
					onChange={ vi.fn() }
					onClose={ vi.fn() }
				/>
			</SlotFillProvider>
		);

		expect(
			screen.queryByRole( 'button', { name: 'Create page' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Add block' } )
		).not.toBeInTheDocument();
	} );

	it( 'renders the consumer’s tools beside page creation', () => {
		render(
			<LinkUI
				link={ {} }
				onCreatePage={ vi.fn() }
				tools={ [
					{ id: 'blocks', label: 'Add block', render: () => null },
				] }
				onChange={ vi.fn() }
				onClose={ vi.fn() }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Create page' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Add block' } )
		).toBeVisible();
	} );

	it( 'carries the search term into the page creator and back out again', async () => {
		const user = userEvent.setup();
		render(
			<LinkUI
				link={ {} }
				onCreatePage={ vi.fn() }
				onChange={ vi.fn() }
				onClose={ vi.fn() }
			/>
		);

		await user.type( getSearchInput(), 'New Page' );
		await user.click(
			screen.getByRole( 'button', { name: 'Create page' } )
		);

		expect( screen.getByRole( 'textbox', { name: 'Title' } ) ).toHaveValue(
			'New Page'
		);
		expect(
			screen.queryByRole( 'combobox', { name: 'Search or type URL' } )
		).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Back' } ) );

		expect( getSearchInput() ).toHaveValue( 'New Page' );
		expect(
			screen.getByRole( 'button', { name: 'Create page' } )
		).toHaveFocus();
	} );

	it( 'does not prefill the title with a URL', async () => {
		const user = userEvent.setup();
		render(
			<LinkUI
				link={ {} }
				onCreatePage={ vi.fn() }
				onChange={ vi.fn() }
				onClose={ vi.fn() }
			/>
		);

		await user.type( getSearchInput(), 'https://example.com' );
		await user.click(
			screen.getByRole( 'button', { name: 'Create page' } )
		);

		expect( screen.getByRole( 'textbox', { name: 'Title' } ) ).toHaveValue(
			''
		);
	} );

	it( 'links to the page it creates', async () => {
		const user = userEvent.setup();
		const onCreatePage = vi.fn().mockResolvedValue( createdPage );
		const onChange = vi.fn();
		render(
			<LinkUI
				link={ {} }
				onCreatePage={ onCreatePage }
				onChange={ onChange }
				onClose={ vi.fn() }
			/>
		);

		await user.type( getSearchInput(), 'New Page' );
		await user.click(
			screen.getByRole( 'button', { name: 'Create page' } )
		);
		await user.click( screen.getByRole( 'checkbox', { name: 'Publish' } ) );
		await user.click(
			screen.getByRole( 'button', { name: 'Create page' } )
		);

		await waitFor( () =>
			expect( onChange ).toHaveBeenCalledWith( createdPage )
		);
		expect( onCreatePage ).toHaveBeenCalledWith( {
			title: 'New Page',
			publish: false,
		} );
		expect( mockCreateSuccessNotice ).toHaveBeenCalled();
		// Back on the search pane, with the search cleared.
		expect( getSearchInput() ).toHaveValue( '' );
	} );

	it( 'keeps the page creator open and shows why creation failed', async () => {
		const user = userEvent.setup();
		const onCreatePage = vi
			.fn()
			.mockRejectedValue( { message: 'Pages are read only here.' } );
		const onChange = vi.fn();
		render(
			<LinkUI
				link={ {} }
				onCreatePage={ onCreatePage }
				onChange={ onChange }
				onClose={ vi.fn() }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Create page' } )
		);
		await user.type(
			screen.getByRole( 'textbox', { name: 'Title' } ),
			'New Page'
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Create page' } )
		);

		// The message is also spoken, outside the dialog.
		expect(
			await within( screen.getByRole( 'dialog' ) ).findByText(
				'Pages are read only here.'
			)
		).toBeVisible();
		expect( screen.getByRole( 'textbox', { name: 'Title' } ) ).toHaveValue(
			'New Page'
		);
		expect( onChange ).not.toHaveBeenCalled();
		expect( mockCreateErrorNotice ).toHaveBeenCalled();
	} );

	it( 'opens a consumer pane and returns focus to the tool that opened it', async () => {
		const user = userEvent.setup();
		render(
			<LinkUI
				link={ {} }
				tools={ [
					{
						id: 'blocks',
						label: 'Add block',
						render: ( { onBack } ) => (
							<div>
								<p>Block list</p>
								<button onClick={ onBack }>Go back</button>
							</div>
						),
					},
				] }
				onChange={ vi.fn() }
				onClose={ vi.fn() }
			/>
		);

		await user.type( getSearchInput(), 'Search' );
		await user.click( screen.getByRole( 'button', { name: 'Add block' } ) );

		expect( screen.getByText( 'Block list' ) ).toBeVisible();
		expect(
			screen.queryByRole( 'combobox', { name: 'Search or type URL' } )
		).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Go back' } ) );

		expect( getSearchInput() ).toHaveValue( 'Search' );
		expect(
			screen.getByRole( 'button', { name: 'Add block' } )
		).toHaveFocus();
	} );
} );
