/**
 * External dependencies
 */
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import LinkControl from '../';
import {
	fauxEntitySuggestions,
	fetchFauxEntitySuggestions,
	uniqueId,
} from './fixtures';

const mockFetchSearchSuggestions = jest.fn();

/**
 * The call to the real method `fetchRichUrlData` is wrapped in a promise in order to make it cancellable.
 * Therefore if we pass any value as the mock of `fetchRichUrlData` then ALL of the tests will require
 * addition code to handle the async nature of `fetchRichUrlData`. This is unecessary. Instead we default
 * to an undefined value which will ensure that the code under test does not call `fetchRichUrlData`. Only
 * when we are testing the "rich previews" to we update this value with a true mock.
 */
let mockFetchRichUrlData;

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );
useSelect.mockImplementation( () => ( {
	fetchSearchSuggestions: mockFetchSearchSuggestions,
	fetchRichUrlData: mockFetchRichUrlData,
} ) );

jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: () => ( { saveEntityRecords: jest.fn() } ),
} ) );

jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useReducedMotion: jest.fn( () => true ),
} ) );

beforeEach( () => {
	// Setup a DOM element as a render target.
	mockFetchSearchSuggestions.mockImplementation( fetchFauxEntitySuggestions );
} );

afterEach( () => {
	// Cleanup on exiting.
	mockFetchSearchSuggestions.mockReset();
	mockFetchRichUrlData?.mockReset(); // Conditionally reset as it may NOT be a mock.
} );

/**
 * Workaround to trigger an arrow up keypress event.
 *
 * @todo Remove this workaround in favor of userEvent.keyboard() or userEvent.type().
 *
 * For some reason, this doesn't work:
 *
 * ```
 * await user.keyboard( '[ArrowDown]' );
 * ```
 *
 * because the event sent has a `keyCode` of `0`.
 *
 * @param {Element} element Element to trigger the event on.
 */
function triggerArrowUp( element ) {
	fireEvent.keyDown( element, {
		key: 'ArrowUp',
		keyCode: 38,
	} );
}

/**
 * Workaround to trigger an arrow down keypress event.
 *
 * @todo Remove this workaround in favor of userEvent.keyboard() or userEvent.type().
 *
 * For some reason, this doesn't work:
 *
 * ```
 * await user.keyboard( '[ArrowDown]' );
 * ```
 *
 * because the event sent has a `keyCode` of `0`.
 *
 * @param {Element} element Element to trigger the event on.
 */
function triggerArrowDown( element ) {
	fireEvent.keyDown( element, {
		key: 'ArrowDown',
		keyCode: 40,
	} );
}

/**
 * Workaround to trigger an Enter keypress event.
 *
 * @todo Remove this workaround in favor of userEvent.keyboard() or userEvent.type().
 *
 * For some reason, this doesn't work:
 *
 * ```
 * await user.keyboard( '[Enter]' );
 * ```
 *
 * because the event sent has a `keyCode` of `0`.
 *
 * @param {Element} element Element to trigger the event on.
 */
function triggerEnter( element ) {
	fireEvent.keyDown( element, {
		key: 'Enter',
		keyCode: 13,
	} );
}

describe( 'Basic rendering', () => {
	it( 'should render', () => {
		render( <LinkControl /> );

		// Search Input UI.
		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		expect( searchInput ).toBeVisible();
	} );

	it( 'should have aria-owns attribute to follow the ARIA 1.0 pattern', () => {
		render( <LinkControl /> );

		// Search Input UI.
		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		expect( searchInput ).toBeVisible();
		// Make sure we use the ARIA 1.0 pattern with aria-owns.
		// See https://github.com/WordPress/gutenberg/issues/47147
		expect( searchInput ).not.toHaveAttribute( 'aria-controls' );
		expect( searchInput ).toHaveAttribute( 'aria-owns' );
	} );

	it( 'should have aria-selected attribute only on the highlighted item', async () => {
		const user = userEvent.setup();

		let resolver;
		mockFetchSearchSuggestions.mockImplementation(
			() =>
				new Promise( ( resolve ) => {
					resolver = resolve;
				} )
		);

		render( <LinkControl /> );

		// Search Input UI.
		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		// Simulate searching for a term.
		await user.type( searchInput, 'Hello' );

		// Wait for the spinner SVG icon to be rendered.
		expect( await screen.findByRole( 'presentation' ) ).toBeVisible();
		// Check the suggestions list is not rendered yet.
		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();

		// Make the search suggestions fetch return a response.
		resolver( fauxEntitySuggestions );

		const resultsList = await screen.findByRole( 'listbox', {
			name: 'Search results for "Hello"',
		} );

		// Check the suggestions list is rendered.
		expect( resultsList ).toBeVisible();
		// Check the spinner SVG icon is not rendered any longer.
		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();

		const searchResultElements =
			within( resultsList ).getAllByRole( 'option' );

		expect( searchResultElements ).toHaveLength(
			// The fauxEntitySuggestions length plus the 'Press ENTER to add this link' button.
			fauxEntitySuggestions.length + 1
		);

		// Step down into the search results, highlighting the first result item.
		triggerArrowDown( searchInput );

		const firstSearchSuggestion = searchResultElements[ 0 ];
		const secondSearchSuggestion = searchResultElements[ 1 ];

		let selectedSearchResultElement = screen.getByRole( 'option', {
			selected: true,
		} );

		// We should have highlighted the first item using the keyboard.
		expect( selectedSearchResultElement ).toEqual( firstSearchSuggestion );

		// Check the aria-selected attribute is set only on the highlighted item.
		expect( firstSearchSuggestion ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		// Check the aria-selected attribute is omitted on the non-highlighted items.
		expect( secondSearchSuggestion ).not.toHaveAttribute( 'aria-selected' );

		// Step down into the search results, highlighting the second result item.
		triggerArrowDown( searchInput );

		selectedSearchResultElement = screen.getByRole( 'option', {
			selected: true,
		} );

		// We should have highlighted the first item using the keyboard.
		expect( selectedSearchResultElement ).toEqual( secondSearchSuggestion );

		// Check the aria-selected attribute is omitted on non-highlighted items.
		expect( firstSearchSuggestion ).not.toHaveAttribute( 'aria-selected' );
		// Check the aria-selected attribute is set only on the highlighted item.
		expect( secondSearchSuggestion ).toHaveAttribute(
			'aria-selected',
			'true'
		);

		// Step up into the search results, highlighting the first result item.
		triggerArrowUp( searchInput );

		selectedSearchResultElement = screen.getByRole( 'option', {
			selected: true,
		} );

		// We should be back to highlighting the first search result again.
		expect( selectedSearchResultElement ).toEqual( firstSearchSuggestion );

		// Check the aria-selected attribute is set only on the highlighted item.
		expect( firstSearchSuggestion ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		// Check the aria-selected attribute is omitted on non-highlighted items.
		expect( secondSearchSuggestion ).not.toHaveAttribute( 'aria-selected' );
	} );

	it( 'should not render protocol in links', async () => {
		const user = userEvent.setup();
		mockFetchSearchSuggestions.mockImplementation( () =>
			Promise.resolve( [
				{
					id: uniqueId(),
					title: 'Hello Page',
					type: 'Page',
					info: '2 days ago',
					url: `http://example.com/?p=${ uniqueId() }`,
				},
				{
					id: uniqueId(),
					title: 'Hello Post',
					type: 'Post',
					info: '19 days ago',
					url: `https://example.com/${ uniqueId() }`,
				},
			] )
		);

		const searchTerm = 'Hello';

		render( <LinkControl /> );

		// Search Input UI.
		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		// Simulate searching for a term.
		await user.type( searchInput, searchTerm );

		expect( screen.queryByText( '://' ) ).not.toBeInTheDocument();
	} );

	describe( 'forceIsEditingLink', () => {
		it( 'undefined', () => {
			render( <LinkControl value={ { url: 'https://example.com' } } /> );

			expect(
				screen.queryByRole( 'combobox', { name: 'URL' } )
			).not.toBeInTheDocument();
		} );

		it( 'true', () => {
			render(
				<LinkControl
					value={ { url: 'https://example.com' } }
					forceIsEditingLink
				/>
			);

			expect(
				screen.getByRole( 'combobox', { name: 'URL' } )
			).toBeVisible();
		} );

		it( 'false', async () => {
			const user = userEvent.setup();
			const { rerender } = render(
				<LinkControl value={ { url: 'https://example.com' } } />
			);

			// Click the "Edit" button to trigger into the editing mode.
			const editButton = screen.queryByRole( 'button', {
				name: 'Edit',
			} );

			await user.click( editButton );

			expect(
				screen.getByRole( 'combobox', { name: 'URL' } )
			).toBeVisible();

			// If passed `forceIsEditingLink` of `false` while editing, should
			// forcefully reset to the preview state.
			rerender(
				<LinkControl
					value={ { url: 'https://example.com' } }
					forceIsEditingLink={ false }
				/>
			);

			expect(
				screen.queryByRole( 'combobox', { name: 'URL' } )
			).not.toBeInTheDocument();
		} );

		it( 'should display human friendly error message if value URL prop is empty when component is forced into no-editing (preview) mode', async () => {
			// Why do we need this test?
			// Occasionally `forceIsEditingLink` is set explictly to `false` which causes the Link UI to render
			// it's preview even if the `value` has no URL.
			// for an example of this see the usage in the following file whereby forceIsEditingLink is used to start/stop editing mode:
			// https://github.com/WordPress/gutenberg/blob/fa5728771df7cdc86369f7157d6aa763649937a7/packages/format-library/src/link/inline.js#L151.
			// see also: https://github.com/WordPress/gutenberg/issues/17972.

			const valueWithEmptyURL = {
				url: '',
				id: 123,
				type: 'post',
			};

			render(
				<LinkControl
					value={ valueWithEmptyURL }
					forceIsEditingLink={ false }
				/>
			);

			const linkPreview = screen.getByLabelText( 'Currently selected' );

			const isPreviewError = linkPreview.classList.contains( 'is-error' );
			expect( isPreviewError ).toBe( true );

			expect( screen.queryByText( 'Link is empty' ) ).toBeVisible();
		} );
	} );

	describe( 'Unlinking', () => {
		it( 'should not show "Unlink" button if no onRemove handler is provided', () => {
			render( <LinkControl value={ { url: 'https://example.com' } } /> );

			const unLinkButton = screen.queryByRole( 'button', {
				name: 'Unlink',
			} );

			expect( unLinkButton ).not.toBeInTheDocument();
		} );

		it( 'should show "Unlink" button if a onRemove handler is provided', async () => {
			const user = userEvent.setup();
			const mockOnRemove = jest.fn();

			render(
				<LinkControl
					value={ { url: 'https://example.com' } }
					onRemove={ mockOnRemove }
				/>
			);

			const unLinkButton = screen.queryByRole( 'button', {
				name: 'Unlink',
			} );
			expect( unLinkButton ).toBeVisible();

			await user.click( unLinkButton );

			expect( mockOnRemove ).toHaveBeenCalled();
		} );
	} );
} );

describe( 'Searching for a link', () => {
	it( 'should display loading UI when input is valid but search results have yet to be returned', async () => {
		const user = userEvent.setup();
		const searchTerm = 'Hello';

		let resolver;
		mockFetchSearchSuggestions.mockImplementation(
			() =>
				new Promise( ( resolve ) => {
					resolver = resolve;
				} )
		);

		render( <LinkControl /> );

		// Search Input UI.
		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		// Simulate searching for a term.
		await user.type( searchInput, searchTerm );

		expect( await screen.findByRole( 'presentation' ) ).toBeVisible();
		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();

		// make the search suggestions fetch return a response
		resolver( fauxEntitySuggestions );

		expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
	} );

	it( 'should display only search suggestions when current input value is not URL-like', async () => {
		const user = userEvent.setup();
		const searchTerm = 'Hello world';
		const firstSuggestion = fauxEntitySuggestions[ 0 ];

		render( <LinkControl /> );

		// Search Input UI.
		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		// Simulate searching for a term.
		await user.type( searchInput, searchTerm );

		const searchResultElements = within(
			await screen.findByRole( 'listbox', {
				name: /Search results for.*/,
			} )
		).getAllByRole( 'option' );

		expect( searchResultElements ).toHaveLength(
			fauxEntitySuggestions.length
		);

		expect( searchInput ).toHaveAttribute( 'aria-expanded', 'true' );

		// Check that a search suggestion shows up corresponding to the data.
		expect( searchResultElements[ 0 ] ).toHaveTextContent(
			firstSuggestion.title
		);
		expect( searchResultElements[ 0 ] ).toHaveTextContent(
			firstSuggestion.type
		);

		// The fallback URL suggestion should not be shown when input is not URL-like.
		expect(
			searchResultElements[ searchResultElements.length - 1 ]
		).not.toHaveTextContent( 'URL' );
	} );

	it( 'should trim search term', async () => {
		const user = userEvent.setup();
		const searchTerm = '   Hello    ';

		render( <LinkControl /> );

		// Search Input UI.
		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		// Simulate searching for a term.
		await user.type( searchInput, searchTerm );

		const searchResults = await screen.findByRole( 'listbox', {
			name: /Search results for.*/,
		} );

		const searchResultTextHighlightElements = within( searchResults )
			.getAllByRole( 'option' )
			// TODO: Change to `getByRole( 'mark' )` when officially supported by
			// WAI-ARIA 1.3 - see https://w3c.github.io/aria/#mark
			// eslint-disable-next-line testing-library/no-node-access
			.map( ( searchResult ) => searchResult.querySelector( 'mark' ) )
			.flat()
			.filter( Boolean );

		// Given we're mocking out the results we should always have 4 mark elements.
		expect( searchResultTextHighlightElements ).toHaveLength( 4 );

		// Make sure there are no `mark` elements which contain anything other
		// than the trimmed search term (ie: no whitespace).
		expect(
			searchResultTextHighlightElements.every(
				( mark ) => mark.innerHTML === 'Hello'
			)
		).toBe( true );

		// Implementation detail test to ensure that the fetch handler is called
		// with the trimmed search value. We do this because we are mocking out
		// the fetch handler in our test so we need to assert it would be called
		// correctly in a real world scenario.
		expect( mockFetchSearchSuggestions ).toHaveBeenCalledWith(
			'Hello',
			expect.anything()
		);
	} );

	it( 'should not call search handler when showSuggestions is false', async () => {
		const user = userEvent.setup();
		render( <LinkControl showSuggestions={ false } /> );

		// Search Input UI.
		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		// Simulate searching for a term.
		await user.type( searchInput, 'anything' );

		const searchResultsField = screen.queryByRole( 'listbox' );

		expect( searchResultsField ).not.toBeInTheDocument();
		expect( mockFetchSearchSuggestions ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ 'couldbeurlorentitysearchterm' ],
		[ 'ThisCouldAlsoBeAValidURL' ],
	] )(
		'should display a URL suggestion as a default fallback for the search term "%s" which could potentially be a valid url.',
		async ( searchTerm ) => {
			const user = userEvent.setup();
			render( <LinkControl /> );

			// Search Input UI.
			const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

			// Simulate searching for a term.
			await user.type( searchInput, searchTerm );

			const searchResultElements = within(
				await screen.findByRole( 'listbox', {
					name: /Search results for.*/,
				} )
			).getAllByRole( 'option' );

			const lastSearchResultItem =
				searchResultElements[ searchResultElements.length - 1 ];

			// We should see a search result for each of the expect search suggestions
			// plus 1 additional one for the fallback URL suggestion.
			expect( searchResultElements ).toHaveLength(
				fauxEntitySuggestions.length + 1
			);

			// The last item should be a URL search suggestion.
			expect( lastSearchResultItem ).toHaveTextContent( searchTerm );
			expect( lastSearchResultItem ).toHaveTextContent( 'URL' );
			expect( lastSearchResultItem ).toHaveTextContent(
				'Press ENTER to add this link'
			);
		}
	);

	it( 'should not display a URL suggestion as a default fallback when noURLSuggestion is passed.', async () => {
		const user = userEvent.setup();
		render( <LinkControl noURLSuggestion /> );

		// Search Input UI.
		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		// Simulate searching for a term.
		await user.type( searchInput, 'couldbeurlorentitysearchterm' );

		const searchResultElements = within(
			await screen.findByRole( 'listbox', {
				name: /Search results for.*/,
			} )
		).getAllByRole( 'option' );

		// We should see a search result for each of the expect search suggestions and nothing else.
		expect( searchResultElements ).toHaveLength(
			fauxEntitySuggestions.length
		);
	} );
} );

describe( 'Manual link entry', () => {
	it.each( [
		[ 'https://make.wordpress.org' ], // Explicit https.
		[ 'http://make.wordpress.org' ], // Explicit http.
		[ 'www.wordpress.org' ], // Usage of "www".
	] )(
		'should display a single suggestion result when the current input value is URL-like (eg: %s)',
		async ( searchTerm ) => {
			const user = userEvent.setup();
			render( <LinkControl /> );

			// Search Input UI.
			const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

			// Simulate searching for a term.
			await user.type( searchInput, searchTerm );

			const searchResultElements = within(
				await screen.findByRole( 'listbox', {
					name: /Search results for.*/,
				} )
			).getByRole( 'option' );

			expect( searchResultElements ).toBeVisible();
			expect( searchResultElements ).toHaveTextContent( searchTerm );
			expect( searchResultElements ).toHaveTextContent( 'URL' );
			expect( searchResultElements ).toHaveTextContent(
				'Press ENTER to add this link'
			);
		}
	);

	describe( 'Handling of empty values', () => {
		const testTable = [
			[ 'containing only spaces', '        ' ],
			[ 'containing only tabs', '[Tab]' ],
			[ 'from strings with no length', '' ],
		];

		it.each( testTable )(
			'should not allow creation of links %s when using the keyboard',
			async ( _desc, searchString ) => {
				const user = userEvent.setup();

				render( <LinkControl /> );

				// Search Input UI.
				const searchInput = screen.getByRole( 'combobox', {
					name: 'URL',
				} );

				let submitButton = screen.getByRole( 'button', {
					name: 'Apply',
				} );

				expect( submitButton ).toBeDisabled();
				expect( submitButton ).toBeVisible();

				if ( searchString.length ) {
					// Simulate searching for a term.
					await user.type( searchInput, searchString );
				} else {
					// Simulate clearing the search term.
					await user.clear( searchInput );
				}

				// Attempt to submit the empty search value in the input.
				await user.keyboard( '[Enter]' );

				submitButton = screen.getByRole( 'button', {
					name: 'Apply',
				} );

				// Verify the UI hasn't allowed submission.
				expect( searchInput ).toBeVisible();
				expect( submitButton ).toBeDisabled();
				expect( submitButton ).toBeVisible();
			}
		);

		it.each( testTable )(
			'should not allow creation of links %s via the UI "submit" button',
			async ( _desc, searchString ) => {
				const user = userEvent.setup();

				render( <LinkControl /> );

				// Search Input UI.
				const searchInput = screen.getByRole( 'combobox', {
					name: 'URL',
				} );

				let submitButton = screen.queryByRole( 'button', {
					name: 'Apply',
				} );

				expect( submitButton ).toBeDisabled();
				expect( submitButton ).toBeVisible();

				// Simulate searching for a term.
				if ( searchString.length ) {
					// Simulate searching for a term.
					await user.type( searchInput, searchString );
				} else {
					// Simulate clearing the search term.
					await user.clear( searchInput );
				}

				// Attempt to submit the empty search value in the input.
				await user.click( submitButton );

				submitButton = screen.queryByRole( 'button', {
					name: 'Apply',
				} );

				// Verify the UI hasn't allowed submission.
				expect( searchInput ).toBeVisible();
				expect( submitButton ).toBeDisabled();
				expect( submitButton ).toBeVisible();
			}
		);
	} );

	describe( 'Handling cancellation', () => {
		it( 'should allow cancellation of the link creation process and reset any entered values', async () => {
			const user = userEvent.setup();
			const mockOnRemove = jest.fn();
			const mockOnCancel = jest.fn();

			render( <LinkControl onRemove={ mockOnRemove } /> );

			// Search Input UI.
			const searchInput = screen.getByRole( 'combobox', {
				name: 'URL',
			} );

			const cancelButton = screen.queryByRole( 'button', {
				name: 'Cancel',
			} );

			expect( cancelButton ).toBeEnabled();
			expect( cancelButton ).toBeVisible();

			// Simulate adding a link for a term.
			await user.type( searchInput, 'https://www.wordpress.org' );

			// Attempt to submit the empty search value in the input.
			await user.click( cancelButton );

			// Verify the consumer can handle the cancellation.
			expect( mockOnRemove ).toHaveBeenCalled();

			// Ensure optional callback is not called.
			expect( mockOnCancel ).not.toHaveBeenCalled();

			expect( searchInput ).toHaveValue( '' );
		} );

		it( 'should allow cancellation of the link editing process and reset any entered values', async () => {
			const user = userEvent.setup();
			const initialLink = fauxEntitySuggestions[ 0 ];

			const LinkControlConsumer = () => {
				const [ link, setLink ] = useState( initialLink );

				return (
					<LinkControl
						value={ link }
						onChange={ ( suggestion ) => {
							setLink( suggestion );
						} }
						hasTextControl
					/>
				);
			};

			render( <LinkControlConsumer /> );

			let linkPreview = screen.getByLabelText( 'Currently selected' );

			expect( linkPreview ).toBeInTheDocument();

			// Click the "Edit" button to trigger into the editing mode.
			let editButton = screen.queryByRole( 'button', {
				name: 'Edit',
			} );

			await user.click( editButton );

			await toggleSettingsDrawer( user );

			let searchInput = screen.getByRole( 'combobox', {
				name: 'URL',
			} );

			let textInput = screen.getByRole( 'textbox', {
				name: 'Text',
			} );

			// Make a change to the search input.
			await user.type( searchInput, 'This URL value was changed!' );

			// Make a change to the text input.
			await user.type( textInput, 'This text value was changed!' );

			const cancelButton = screen.queryByRole( 'button', {
				name: 'Cancel',
			} );

			// Cancel the editing process.
			await user.click( cancelButton );

			linkPreview = screen.getByLabelText( 'Currently selected' );

			expect( linkPreview ).toBeInTheDocument();

			// Re-query the edit button as it's been replaced.
			editButton = screen.queryByRole( 'button', {
				name: 'Edit',
			} );

			await user.click( editButton );

			await toggleSettingsDrawer( user );

			// Re-query the inputs as they have been replaced.
			searchInput = screen.getByRole( 'combobox', {
				name: 'URL',
			} );

			textInput = screen.getByRole( 'textbox', {
				name: 'Text',
			} );

			// Expect to see the original link values and **not** the changed values.
			expect( searchInput ).toHaveValue( initialLink.url );
			expect( textInput ).toHaveValue( initialLink.text );
		} );

		it( 'should call onCancel callback when cancelling if provided', async () => {
			const user = userEvent.setup();
			const mockOnCancel = jest.fn();

			render( <LinkControl onCancel={ mockOnCancel } /> );

			const cancelButton = screen.queryByRole( 'button', {
				name: 'Cancel',
			} );

			await user.click( cancelButton );

			// Verify the consumer can handle the cancellation.
			expect( mockOnCancel ).toHaveBeenCalled();
		} );
	} );

	describe( 'Alternative link protocols and formats', () => {
		it.each( [
			[ 'mailto:example123456@wordpress.org', 'mailto' ],
			[ 'tel:example123456@wordpress.org', 'tel' ],
			[ '#internal-anchor', 'internal' ],
		] )(
			'should recognise "%s" as a %s link and handle as manual entry by displaying a single suggestion',
			async ( searchTerm, searchType ) => {
				const user = userEvent.setup();
				render( <LinkControl /> );

				// Search Input UI.
				const searchInput = screen.getByRole( 'combobox', {
					name: 'URL',
				} );

				// Simulate searching for a term.
				await user.type( searchInput, searchTerm );

				const searchResultElements = within(
					await screen.findByRole( 'listbox', {
						name: /Search results for.*/,
					} )
				).getByRole( 'option' );

				expect( searchResultElements ).toBeVisible();
				expect( searchResultElements ).toHaveTextContent( searchTerm );
				expect( searchResultElements ).toHaveTextContent( searchType );
				expect( searchResultElements ).toHaveTextContent(
					'Press ENTER to add this link'
				);
			}
		);
	} );
} );

describe( 'Default search suggestions', () => {
	it( 'should display a list of initial search suggestions when there is no search value or suggestions', async () => {
		render( <LinkControl showInitialSuggestions /> );

		expect(
			await screen.findByRole( 'listbox', {
				name: 'Recently updated',
			} )
		).toBeVisible();

		// Verify input has no value has default suggestions should only show
		// when this does not have a value.
		// Search Input UI.
		expect( screen.getByRole( 'combobox', { name: 'URL' } ) ).toHaveValue(
			''
		);

		// Ensure only called once as a guard against potential infinite
		// re-render loop within `componentDidUpdate` calling `updateSuggestions`
		// which has calls to `setState` within it.
		expect( mockFetchSearchSuggestions ).toHaveBeenCalledTimes( 1 );

		// Verify the search results already display the initial suggestions.
		// `LinkControl` internally always limits the number of initial suggestions to 3.
		expect( screen.queryAllByRole( 'option' ) ).toHaveLength( 3 );
	} );

	it( 'should not display initial suggestions when input value is present', async () => {
		const user = userEvent.setup();

		// Render with an initial value an ensure that no initial suggestions are shown.
		const initialValue = fauxEntitySuggestions[ 0 ];
		render( <LinkControl showInitialSuggestions value={ initialValue } /> );

		expect( mockFetchSearchSuggestions ).not.toHaveBeenCalled();

		// Click the "Edit/Change" button and check initial suggestions are not
		// shown.
		const currentLinkUI = screen.getByLabelText( 'Currently selected' );
		const currentLinkBtn = within( currentLinkUI ).getByRole( 'button', {
			name: 'Edit',
		} );
		await user.click( currentLinkBtn );

		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );
		// Search input is set to the URL value.
		expect( searchInput ).toHaveValue( initialValue.url );

		// Focus the search input to display suggestions
		await user.click( searchInput );

		const searchResultElements = within(
			await screen.findByRole( 'listbox', {
				name: /Search results for.*/,
			} )
		).getAllByRole( 'option' );

		// It should match any url that's like ?p= and also include a URL option.
		expect( searchResultElements ).toHaveLength( 5 );

		expect( searchInput ).toHaveAttribute( 'aria-expanded', 'true' );

		expect( mockFetchSearchSuggestions ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should display initial suggestions when input value is manually deleted', async () => {
		const user = userEvent.setup();
		const searchTerm = 'Hello world';

		render( <LinkControl showInitialSuggestions /> );

		// Search Input UI.
		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		// Simulate searching for a term.
		await user.type( searchInput, searchTerm );

		expect( searchInput ).toHaveValue( searchTerm );

		const searchResultsList = await screen.findByRole( 'listbox', {
			name: /Search results for.*/,
		} );

		expect( searchResultsList ).toBeVisible();

		expect(
			within( searchResultsList ).getAllByRole( 'option' )
		).toHaveLength( 4 );

		// Delete the text.
		await userEvent.clear( searchInput );

		// Check the input is empty now.
		expect( searchInput ).toHaveValue( '' );

		const initialResultsList = await screen.findByRole( 'listbox', {
			name: 'Recently updated',
		} );

		expect(
			within( initialResultsList ).getAllByRole( 'option' )
		).toHaveLength( 3 );
	} );

	it( 'should not display initial suggestions when there are no recently updated pages/posts', async () => {
		// Force API returning empty results for recently updated Pages.
		mockFetchSearchSuggestions.mockImplementation( async () => [] );

		render( <LinkControl showInitialSuggestions /> );

		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		const searchResultsField = screen.queryByRole( 'listbox', {
			name: 'Recently updated',
		} );

		expect( searchResultsField ).not.toBeInTheDocument();

		expect( searchInput ).toHaveAttribute( 'aria-expanded', 'false' );
	} );
} );

describe( 'Creating Entities (eg: Posts, Pages)', () => {
	const noResults = [];
	beforeEach( () => {
		// Force returning empty results for existing Pages. Doing this means that the only item
		// shown should be "Create Page" suggestion because there will be no search suggestions
		// and our input does not conform to a direct entry schema (eg: a URL).
		mockFetchSearchSuggestions.mockImplementation( () =>
			Promise.resolve( noResults )
		);
	} );
	it.each( [
		[ 'HelloWorld', 'without spaces' ],
		[ 'Hello World', 'with spaces' ],
	] )(
		'should allow creating a link for a valid Entity title "%s" (%s)',
		async ( entityNameText ) => {
			const user = userEvent.setup();
			let resolver;
			const createSuggestion = ( title ) =>
				new Promise( ( resolve ) => {
					resolver = () =>
						resolve( {
							title,
							id: 123,
							url: '/?p=123',
							type: 'page',
						} );
				} );

			const LinkControlConsumer = () => {
				const [ link, setLink ] = useState( null );

				return (
					<LinkControl
						value={ link }
						onChange={ ( suggestion ) => {
							setLink( suggestion );
						} }
						createSuggestion={ createSuggestion }
					/>
				);
			};

			render( <LinkControlConsumer /> );

			// Search Input UI.
			const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

			// Simulate searching for a term.
			await user.type( searchInput, entityNameText );

			const searchResults = await screen.findByRole( 'listbox', {
				name: /Search results for.*/,
			} );

			const createButton = within( searchResults ).getByRole( 'option', {
				name: /^Create:/,
			} );

			expect( createButton ).toBeVisible();
			expect( createButton ).toHaveTextContent( entityNameText );

			// No need to wait in this test because we control the Promise
			// resolution manually via the `resolver` reference.
			await user.click( createButton );

			// Check for loading indicator.
			const loadingIndicator = screen.getByText( 'Creating…' );
			const currentLinkLabel =
				screen.queryByLabelText( 'Currently selected' );

			expect( currentLinkLabel ).not.toBeInTheDocument();
			expect( loadingIndicator ).toBeVisible();
			expect( loadingIndicator ).toHaveClass(
				'block-editor-link-control__loading'
			);

			// Resolve the `createSuggestion` promise.
			resolver();

			const currentLink = await screen.findByLabelText(
				'Currently selected'
			);

			expect( currentLink ).toHaveTextContent( entityNameText );
			expect( currentLink ).toHaveTextContent( '/?p=123' );
		}
	);

	it( 'should allow createSuggestion prop to return a non-Promise value', async () => {
		const user = userEvent.setup();
		const LinkControlConsumer = () => {
			const [ link, setLink ] = useState( null );

			return (
				<LinkControl
					value={ link }
					onChange={ ( suggestion ) => {
						setLink( suggestion );
					} }
					createSuggestion={ ( title ) => ( {
						title,
						id: 123,
						url: '/?p=123',
						type: 'page',
					} ) }
				/>
			);
		};

		render( <LinkControlConsumer /> );

		// Search Input UI.
		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		// Simulate searching for a term.
		await user.type( searchInput, 'Some new page to create' );

		const searchResults = await screen.findByRole( 'listbox', {
			name: /Search results for.*/,
		} );

		const createButton = within( searchResults ).getByRole( 'option', {
			name: /^Create:/,
		} );

		await user.click( createButton );

		const currentLink = screen.getByLabelText( 'Currently selected' );

		expect( currentLink ).toHaveTextContent( 'Some new page to create' );
		expect( currentLink ).toHaveTextContent( '/?p=123' );
	} );

	it( 'should allow creation of entities via the keyboard', async () => {
		const user = userEvent.setup();
		const entityNameText = 'A new page to be created';

		const LinkControlConsumer = () => {
			const [ link, setLink ] = useState( null );

			return (
				<LinkControl
					value={ link }
					onChange={ ( suggestion ) => {
						setLink( suggestion );
					} }
					createSuggestion={ ( title ) =>
						Promise.resolve( {
							title,
							id: 123,
							url: '/?p=123',
							type: 'page',
						} )
					}
				/>
			);
		};

		render( <LinkControlConsumer /> );

		// Search Input UI.
		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		// Simulate searching for a term.
		await user.type( searchInput, entityNameText );

		const searchResults = await screen.findByRole( 'listbox', {
			name: /Search results for.*/,
		} );

		// Step down into the search results, selecting the first result item.
		triggerArrowDown( searchInput );

		// Check that the create button is in the results and that it's selected
		const createButton = within( searchResults ).getByRole( 'option', {
			name: /^Create:/,
			selected: true,
		} );
		expect( createButton ).toBeVisible();

		expect( searchInput ).toHaveFocus();
		triggerEnter( searchInput );

		expect(
			await screen.findByLabelText( 'Currently selected' )
		).toHaveTextContent( entityNameText );
	} );

	it( 'should allow customisation of button text', async () => {
		const user = userEvent.setup();
		const entityNameText = 'A new page to be created';

		const LinkControlConsumer = () => {
			return (
				<LinkControl
					createSuggestion={ () => {} }
					createSuggestionButtonText="Custom suggestion text"
				/>
			);
		};

		render( <LinkControlConsumer /> );

		// Search Input UI.
		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		// Simulate searching for a term.
		await user.type( searchInput, entityNameText );

		const searchResults = await screen.findByRole( 'listbox', {
			name: /Search results for.*/,
		} );

		const createButton = within( searchResults ).getByRole( 'option', {
			name: /Custom suggestion text/,
		} );

		expect( createButton ).toBeVisible();
	} );

	describe( 'Do not show create option', () => {
		it.each( [ [ undefined ], [ null ], [ false ] ] )(
			'should not show not show an option to create an entity when "createSuggestion" handler is %s',
			async ( handler ) => {
				render( <LinkControl createSuggestion={ handler } /> );

				// Search Input UI.
				const searchInput = screen.getByRole( 'combobox', {
					name: 'URL',
				} );

				const searchResultsField = screen.queryByRole( 'listbox' );

				// Verify input has no value.
				expect( searchInput ).toHaveValue( '' );
				expect( searchResultsField ).not.toBeInTheDocument(); // Shouldn't exist!
			}
		);

		it( 'should not show an option to create an entity when input is empty', async () => {
			render(
				<LinkControl
					showInitialSuggestions // Should show even if we're not showing initial suggestions.
					createSuggestion={ jest.fn() }
				/>
			);

			// Search Input UI.
			const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

			const searchResultsField = screen.queryByRole( 'listbox' );

			// Verify input has no value.
			expect( searchInput ).toHaveValue( '' );
			expect( searchResultsField ).not.toBeInTheDocument(); // Shouldn't exist!
		} );

		it.each( [
			'https://wordpress.org',
			'www.wordpress.org',
			'mailto:example123456@wordpress.org',
			'tel:example123456@wordpress.org',
			'#internal-anchor',
		] )(
			'should not show option to "Create Page" when text is a form of direct entry (eg: %s)',
			async ( inputText ) => {
				const user = userEvent.setup();
				render( <LinkControl createSuggestion={ jest.fn() } /> );

				// Search Input UI.
				const searchInput = screen.getByRole( 'combobox', {
					name: 'URL',
				} );

				// Simulate searching for a term.
				await user.type( searchInput, inputText );

				const searchResults = await screen.findByRole( 'listbox', {
					name: /Search results for.*/,
				} );

				const createButton = within( searchResults ).queryByRole(
					'option',
					{ name: /New page/ }
				);
				expect( createButton ).not.toBeInTheDocument(); // Shouldn't exist!
			}
		);
	} );

	describe( 'Error handling', () => {
		it( 'should display human-friendly, perceivable error notice and re-show create button and search input if page creation request fails', async () => {
			const user = userEvent.setup();
			const searchText = 'This page to be created';
			let searchInput;

			const throwsError = () => {
				throw new Error( 'API response returned invalid entity.' ); // This can be any error and msg.
			};

			const createSuggestion = () => Promise.reject( throwsError() );

			render( <LinkControl createSuggestion={ createSuggestion } /> );

			// Search Input UI.
			searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

			// Simulate searching for a term.
			await user.type( searchInput, searchText );

			const searchResults = await screen.findByRole( 'listbox', {
				name: /Search results for.*/,
			} );

			const createButton = within( searchResults ).getByRole( 'option', {
				name: /^Create:/,
			} );

			await user.click( createButton );

			searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

			const errorNotice = screen.getAllByText(
				'API response returned invalid entity.'
			)[ 1 ];

			// Catch the error in the test to avoid test failures.
			expect( throwsError ).toThrow( Error );

			// Check human readable error notice is perceivable.
			expect( errorNotice ).toBeVisible();
			// eslint-disable-next-line testing-library/no-node-access
			expect( errorNotice.parentElement ).toHaveClass(
				'block-editor-link-control__search-error'
			);

			// Verify input is repopulated with original search text.
			expect( searchInput ).toBeVisible();
			expect( searchInput ).toHaveValue( searchText );
		} );
	} );
} );

describe( 'Selecting links', () => {
	it( 'should display a selected link corresponding to the provided "currentLink" prop', () => {
		const selectedLink = fauxEntitySuggestions[ 0 ];

		const LinkControlConsumer = () => {
			const [ link ] = useState( selectedLink );

			return <LinkControl value={ link } />;
		};

		render( <LinkControlConsumer /> );

		const currentLink = screen.getByLabelText( 'Currently selected' );
		const currentLinkAnchor = screen.getByRole( 'link', {
			name: `${ selectedLink.title } (opens in a new tab)`,
		} );

		expect( currentLink ).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Edit' } )
		).toBeVisible();
		expect( currentLinkAnchor ).toBeVisible();
	} );

	it( 'should hide "selected" link UI and display search UI prepopulated with previously selected link title when "Change" button is clicked', async () => {
		const user = userEvent.setup();
		const selectedLink = fauxEntitySuggestions[ 0 ];

		const LinkControlConsumer = () => {
			const [ link, setLink ] = useState( selectedLink );

			return (
				<LinkControl
					value={ link }
					onChange={ ( suggestion ) => setLink( suggestion ) }
				/>
			);
		};

		render( <LinkControlConsumer /> );

		// Required in order to select the button below.
		let currentLinkUI = screen.getByLabelText( 'Currently selected' );
		const currentLinkBtn = within( currentLinkUI ).getByRole( 'button', {
			name: 'Edit',
		} );

		// Simulate searching for a term.
		await user.click( currentLinkBtn );

		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );
		currentLinkUI = screen.queryByLabelText( 'Currently selected' );

		// We should be back to showing the search input.
		expect( searchInput ).toBeVisible();
		expect( searchInput ).toHaveValue( selectedLink.url ); // Prepopulated with previous link's URL.
		expect( currentLinkUI ).not.toBeInTheDocument();
	} );

	describe( 'Selection using mouse click', () => {
		it.each( [
			[ 'entity', 'hello world', fauxEntitySuggestions[ 0 ] ], // Entity search.
			[
				'url',
				'https://www.wordpress.org',
				{
					id: '1',
					title: 'https://www.wordpress.org',
					url: 'https://www.wordpress.org',
					type: 'URL',
				},
			], // Url.
		] )(
			'should display a current selected link UI when a %s suggestion for the search "%s" is clicked',
			async ( type, searchTerm, selectedLink ) => {
				const user = userEvent.setup();
				const LinkControlConsumer = () => {
					const [ link, setLink ] = useState();

					return (
						<LinkControl
							value={ link }
							onChange={ ( suggestion ) => setLink( suggestion ) }
						/>
					);
				};

				render( <LinkControlConsumer /> );

				// Search Input UI.
				const searchInput = screen.getByRole( 'combobox', {
					name: 'URL',
				} );

				// Simulate searching for a term.
				await user.type( searchInput, searchTerm );

				const searchResultElements = within(
					await screen.findByRole( 'listbox', {
						name: /Search results for.*/,
					} )
				).getAllByRole( 'option' );

				const firstSearchSuggestion = searchResultElements[ 0 ];

				// Simulate selecting the first of the search suggestions.
				await user.click( firstSearchSuggestion );

				const currentLinkAnchor = screen.getByRole( 'link', {
					name: `${ selectedLink.title } (opens in a new tab)`,
				} );

				// Check that this suggestion is now shown as selected.
				expect(
					screen.getByRole( 'button', { name: 'Edit' } )
				).toBeVisible();
				expect( currentLinkAnchor ).toBeVisible();
			}
		);
	} );

	describe( 'Selection using keyboard', () => {
		it.each( [
			[ 'entity', 'hello world', fauxEntitySuggestions[ 0 ] ], // Entity search.
			[
				'url',
				'https://www.wordpress.org',
				{
					id: '1',
					title: 'https://www.wordpress.org',
					url: 'https://www.wordpress.org',
					type: 'URL',
				},
			], // Url.
		] )(
			'should display a current selected link UI when an %s suggestion for the search "%s" is selected using the keyboard',
			async ( type, searchTerm, selectedLink ) => {
				const user = userEvent.setup();
				const LinkControlConsumer = () => {
					const [ link, setLink ] = useState();

					return (
						<LinkControl
							value={ link }
							onChange={ ( suggestion ) => setLink( suggestion ) }
						/>
					);
				};

				const { container } = render( <LinkControlConsumer /> );

				// Search Input UI.
				const searchInput = screen.getByRole( 'combobox', {
					name: 'URL',
				} );

				// Simulate searching for a term.
				await user.type( searchInput, searchTerm );

				const searchResults = await screen.findByRole( 'listbox', {
					name: /Search results for.*/,
				} );

				// Step down into the search results, highlighting the first result item.
				triggerArrowDown( searchInput );

				const searchResultElements =
					within( searchResults ).getAllByRole( 'option' );

				const firstSearchSuggestion = searchResultElements[ 0 ];
				const secondSearchSuggestion = searchResultElements[ 1 ];

				let selectedSearchResultElement = screen.getByRole( 'option', {
					selected: true,
				} );

				// We should have highlighted the first item using the keyboard.
				expect( selectedSearchResultElement ).toBe(
					firstSearchSuggestion
				);

				// Only entity searches contain more than 1 suggestion.
				if ( type === 'entity' ) {
					// Check we can go down again using the down arrow.
					triggerArrowDown( searchInput );

					selectedSearchResultElement = screen.getByRole( 'option', {
						selected: true,
					} );

					// We should have highlighted the first item using the keyboard
					// eslint-disable-next-line jest/no-conditional-expect
					expect( selectedSearchResultElement ).toBe(
						secondSearchSuggestion
					);

					// Check we can go back up via up arrow.
					triggerArrowUp( searchInput );

					selectedSearchResultElement = screen.getByRole( 'option', {
						selected: true,
					} );

					// We should be back to highlighting the first search result again
					// eslint-disable-next-line jest/no-conditional-expect
					expect( selectedSearchResultElement ).toBe(
						firstSearchSuggestion
					);
				}

				// Submit the selected item as the current link.
				triggerEnter( searchInput );

				// Check that the suggestion selected via is now shown as selected.
				const currentLink =
					screen.getByLabelText( 'Currently selected' );
				const currentLinkAnchor = screen.getByRole( 'link', {
					name: `${ selectedLink.title } (opens in a new tab)`,
				} );

				// Make sure focus is retained after submission.
				// eslint-disable-next-line testing-library/no-node-access
				expect( container.firstChild ).toHaveFocus();

				expect( currentLink ).toBeVisible();
				expect(
					screen.getByRole( 'button', { name: 'Edit' } )
				).toBeVisible();
				expect( currentLinkAnchor ).toBeVisible();
			}
		);

		it( 'should allow selection of initial search results via the keyboard', async () => {
			render( <LinkControl showInitialSuggestions /> );

			expect(
				await screen.findByRole( 'listbox', {
					name: 'Recently updated',
				} )
			).toBeVisible();

			// Search Input UI.
			const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

			// Step down into the search results, highlighting the first result item.
			triggerArrowDown( searchInput );

			const searchResultElements = within(
				screen.getByRole( 'listbox', {
					name: 'Recently updated',
				} )
			).getAllByRole( 'option' );

			const firstSearchSuggestion = searchResultElements[ 0 ];
			const secondSearchSuggestion = searchResultElements[ 1 ];

			let selectedSearchResultElement = screen.getByRole( 'option', {
				selected: true,
			} );

			// We should have highlighted the first item using the keyboard.
			expect( selectedSearchResultElement ).toEqual(
				firstSearchSuggestion
			);

			// Check we can go down again using the down arrow.
			triggerArrowDown( searchInput );

			selectedSearchResultElement = screen.getByRole( 'option', {
				selected: true,
			} );

			// We should have highlighted the first item using the keyboard.
			expect( selectedSearchResultElement ).toEqual(
				secondSearchSuggestion
			);

			// Check we can go back up via up arrow.
			triggerArrowUp( searchInput );

			selectedSearchResultElement = screen.getByRole( 'option', {
				selected: true,
			} );

			// We should be back to highlighting the first search result again.
			expect( selectedSearchResultElement ).toEqual(
				firstSearchSuggestion
			);

			expect( mockFetchSearchSuggestions ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );

describe( 'Addition Settings UI', () => {
	it( 'should not show a means to toggle the link settings when not editing a link', async () => {
		const selectedLink = fauxEntitySuggestions[ 0 ];

		const LinkControlConsumer = () => {
			const [ link ] = useState( selectedLink );

			return <LinkControl value={ link } />;
		};

		render( <LinkControlConsumer /> );

		const settingsToggle = screen.queryByRole( 'button', {
			name: 'Link Settings',
			ariaControls: 'link-settings-1',
		} );

		expect( settingsToggle ).not.toBeInTheDocument();
	} );
	it( 'should provides a means to toggle the link settings', async () => {
		const selectedLink = fauxEntitySuggestions[ 0 ];

		const LinkControlConsumer = () => {
			const [ link ] = useState( selectedLink );

			return <LinkControl value={ link } forceIsEditingLink />;
		};

		render( <LinkControlConsumer /> );

		const user = userEvent.setup();

		const settingsToggle = screen.queryByRole( 'button', {
			name: 'Link Settings',
			ariaControls: 'link-settings-1',
		} );

		expect( settingsToggle ).toHaveAttribute( 'aria-expanded', 'false' );

		expect( settingsToggle ).toBeVisible();

		await user.click( settingsToggle );

		expect( settingsToggle ).toHaveAttribute( 'aria-expanded', 'true' );

		const newTabSettingInput = screen.getByRole( 'checkbox', {
			name: 'Open in new tab',
		} );

		expect( newTabSettingInput ).toBeVisible();

		await user.click( settingsToggle );

		expect( settingsToggle ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( newTabSettingInput ).not.toBeVisible();
	} );

	it( 'should display "New Tab" setting (in "off" mode) by default when a link is selected', async () => {
		const selectedLink = fauxEntitySuggestions[ 0 ];
		const expectedSettingText = 'Open in new tab';

		const LinkControlConsumer = () => {
			const [ link ] = useState( selectedLink );

			return <LinkControl value={ link } forceIsEditingLink />;
		};

		render( <LinkControlConsumer /> );

		const user = userEvent.setup();

		await toggleSettingsDrawer( user );

		const newTabSettingLabel = screen.getByText( expectedSettingText );
		expect( newTabSettingLabel ).toBeVisible();

		const newTabSettingInput = screen.getByRole( 'checkbox', {
			name: expectedSettingText,
			checked: false,
		} );

		expect( newTabSettingInput ).toBeVisible();
	} );

	it( 'should display a setting control with correct default state for each of the custom settings provided', async () => {
		const selectedLink = fauxEntitySuggestions[ 0 ];

		const customSettings = [
			{
				id: 'newTab',
				title: 'Open in new tab',
			},
			{
				id: 'noFollow',
				title: 'No follow',
			},
		];

		const LinkControlConsumer = () => {
			const [ link ] = useState( selectedLink );

			return (
				<LinkControl
					value={ { ...link, newTab: false, noFollow: true } }
					settings={ customSettings }
					forceIsEditingLink
				/>
			);
		};

		render( <LinkControlConsumer /> );

		const user = userEvent.setup();

		await toggleSettingsDrawer( user );

		expect( screen.queryAllByRole( 'checkbox' ) ).toHaveLength( 2 );

		expect(
			screen.getByRole( 'checkbox', {
				name: customSettings[ 0 ].title,
			} )
		).not.toBeChecked();
		expect(
			screen.getByRole( 'checkbox', {
				name: customSettings[ 1 ].title,
			} )
		).toBeChecked();
	} );
} );

describe( 'Post types', () => {
	it( 'should display post type in search results of link', async () => {
		const user = userEvent.setup();
		const searchTerm = 'Hello world';

		render( <LinkControl /> );

		// Search Input UI.
		const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

		// Simulate searching for a term.
		await user.type( searchInput, searchTerm );

		const searchResultElements = within(
			await screen.findByRole( 'listbox', {
				name: /Search results for.*/,
			} )
		).getAllByRole( 'option' );

		searchResultElements.forEach( ( resultItem, index ) => {
			expect( resultItem ).toHaveTextContent(
				fauxEntitySuggestions[ index ].type
			);
		} );
	} );

	it.each( [ 'page', 'post', 'tag', 'post_tag', 'category' ] )(
		'should NOT display post type in search results of %s',
		async ( postType ) => {
			const user = userEvent.setup();
			const searchTerm = 'Hello world';

			render( <LinkControl suggestionsQuery={ { type: postType } } /> );

			// Search Input UI.
			const searchInput = screen.getByRole( 'combobox', { name: 'URL' } );

			// Simulate searching for a term.
			await user.type( searchInput, searchTerm );

			const searchResultElements = within(
				await screen.findByRole( 'listbox', {
					name: /Search results for.*/,
				} )
			).getAllByRole( 'option' );

			searchResultElements.forEach( ( resultItem, index ) => {
				expect(
					screen.queryByText(
						resultItem,
						fauxEntitySuggestions[ index ].type
					)
				).not.toBeInTheDocument();
			} );
		}
	);
} );

describe( 'Rich link previews', () => {
	const selectedLink = {
		id: '1',
		title: 'Wordpress.org', // Customize this for differentiation in assertions.
		url: 'https://www.wordpress.org',
		type: 'URL',
	};

	beforeAll( () => {
		/**
		 * These tests require that we exercise the `fetchRichUrlData` function.
		 * We are therefore overwriting the mock "placeholder" with a true jest mock
		 * which will cause the code under test to execute the code which fetches
		 * rich previews.
		 */
		mockFetchRichUrlData = jest.fn();
	} );

	it( 'should not fetch or display rich previews by default', async () => {
		mockFetchRichUrlData.mockImplementation( () =>
			Promise.resolve( {
				title: 'Blog Tool, Publishing Platform, and CMS \u2014 WordPress.org',
				icon: 'https://s.w.org/favicon.ico?2',
				description:
					'Open source software which you can use to easily create a beautiful website, blog, or app.',
				image: 'https://s.w.org/images/home/screen-themes.png?3',
			} )
		);

		render( <LinkControl value={ selectedLink } /> );

		const linkPreview = screen.getByLabelText( 'Currently selected' );

		const isRichLinkPreview = linkPreview.classList.contains( 'is-rich' );

		expect( mockFetchRichUrlData ).not.toHaveBeenCalled();
		expect( isRichLinkPreview ).toBe( false );
	} );

	it( 'should display a rich preview when data is available', async () => {
		mockFetchRichUrlData.mockImplementation( () =>
			Promise.resolve( {
				title: 'Blog Tool, Publishing Platform, and CMS \u2014 WordPress.org',
				icon: 'https://s.w.org/favicon.ico?2',
				description:
					'Open source software which you can use to easily create a beautiful website, blog, or app.',
				image: 'https://s.w.org/images/home/screen-themes.png?3',
			} )
		);

		render( <LinkControl value={ selectedLink } hasRichPreviews /> );

		const linkPreview = screen.getByLabelText( 'Currently selected' );

		await waitFor( () => expect( linkPreview ).toHaveClass( 'is-rich' ) );
	} );

	it( 'should not display placeholders for the image and description if neither is available in the data', async () => {
		mockFetchRichUrlData.mockImplementation( () =>
			Promise.resolve( {
				title: '',
				icon: 'https://s.w.org/favicon.ico?2',
				description: '',
				image: '',
			} )
		);

		render( <LinkControl value={ selectedLink } hasRichPreviews /> );

		const linkPreview = screen.getByLabelText( 'Currently selected' );

		await waitFor( () => expect( linkPreview ).toHaveClass( 'is-rich' ) );

		// Todo: refactor to use user-facing queries.
		// eslint-disable-next-line testing-library/no-node-access
		const hasRichImagePreview = linkPreview.querySelector(
			'.block-editor-link-control__search-item-image'
		);

		// Todo: refactor to use user-facing queries.
		// eslint-disable-next-line testing-library/no-node-access
		const hasRichDescriptionPreview = linkPreview.querySelector(
			'.block-editor-link-control__search-item-description'
		);

		expect( hasRichImagePreview ).not.toBeInTheDocument();
		expect( hasRichDescriptionPreview ).not.toBeInTheDocument();
	} );

	it( 'should display a fallback when title is missing from rich data', async () => {
		mockFetchRichUrlData.mockImplementation( () =>
			Promise.resolve( {
				icon: 'https://s.w.org/favicon.ico?2',
				description:
					'Open source software which you can use to easily create a beautiful website, blog, or app.',
				image: 'https://s.w.org/images/home/screen-themes.png?3',
			} )
		);

		render( <LinkControl value={ selectedLink } hasRichPreviews /> );

		const linkPreview = screen.getByLabelText( 'Currently selected' );

		await waitFor( () => expect( linkPreview ).toHaveClass( 'is-rich' ) );

		const titlePreview = screen.getByText( selectedLink.title );

		expect( titlePreview ).toHaveClass(
			'block-editor-link-control__search-item-title'
		);
	} );

	it( 'should display a fallback when icon is missing from rich data', async () => {
		mockFetchRichUrlData.mockImplementation( () =>
			Promise.resolve( {
				title: 'Blog Tool, Publishing Platform, and CMS \u2014 WordPress.org',
				description:
					'Open source software which you can use to easily create a beautiful website, blog, or app.',
				image: 'https://s.w.org/images/home/screen-themes.png?3',
			} )
		);

		render( <LinkControl value={ selectedLink } hasRichPreviews /> );

		const linkPreview = screen.getByLabelText( 'Currently selected' );

		await waitFor( () => expect( linkPreview ).toHaveClass( 'is-rich' ) );

		// eslint-disable-next-line testing-library/no-node-access
		const iconPreview = linkPreview.querySelector(
			`.block-editor-link-control__search-item-icon`
		);

		// eslint-disable-next-line testing-library/no-node-access
		const fallBackIcon = iconPreview.querySelector( 'svg' );
		// eslint-disable-next-line testing-library/no-node-access
		const richIcon = iconPreview.querySelector( 'img' );

		expect( fallBackIcon ).toBeVisible();
		expect( richIcon ).not.toBeInTheDocument();
	} );

	it.each( [ 'image', 'description' ] )(
		'should not display the rich %s when it is missing from the data',
		async ( dataItem ) => {
			mockFetchRichUrlData.mockImplementation( () => {
				const data = {
					title: 'Blog Tool, Publishing Platform, and CMS \u2014 WordPress.org',
					icon: 'https://s.w.org/favicon.ico?2',
					description:
						'Open source software which you can use to easily create a beautiful website, blog, or app.',
					image: 'https://s.w.org/images/home/screen-themes.png?3',
				};
				delete data[ dataItem ];
				return Promise.resolve( data );
			} );

			render( <LinkControl value={ selectedLink } hasRichPreviews /> );

			const linkPreview = screen.getByLabelText( 'Currently selected' );

			await waitFor( () =>
				expect( linkPreview ).toHaveClass( 'is-rich' )
			);

			// eslint-disable-next-line testing-library/no-node-access
			const missingDataItem = linkPreview.querySelector(
				`.block-editor-link-control__search-item-${ dataItem }`
			);

			expect( missingDataItem ).not.toBeInTheDocument();
		}
	);

	it.each( [
		[ 'empty', {} ],
		[ 'null', null ],
	] )(
		'should not display a rich preview when data is %s',
		async ( _descriptor, data ) => {
			mockFetchRichUrlData.mockImplementation( async () => data );

			render( <LinkControl value={ selectedLink } hasRichPreviews /> );

			const linkPreview = screen.getByLabelText( 'Currently selected' );

			expect( linkPreview ).toHaveClass( 'is-fetching' );

			await waitFor( () =>
				expect( linkPreview ).not.toHaveClass( 'is-fetching' )
			);

			expect( linkPreview ).not.toHaveClass( 'is-rich' );
		}
	);

	it( 'should display in loading state when rich data is being fetched', async () => {
		const nonResolvingPromise = () => new Promise( () => {} );

		mockFetchRichUrlData.mockImplementation( nonResolvingPromise );

		render( <LinkControl value={ selectedLink } hasRichPreviews /> );

		const linkPreview = screen.getByLabelText( 'Currently selected' );

		expect( linkPreview ).toHaveClass( 'is-fetching' );
		expect( linkPreview ).not.toHaveClass( 'is-rich' );
	} );

	it( 'should remove fetching UI indicators and fallback to standard preview if request for rich preview results in an error', async () => {
		const simulateFailedFetch = () => Promise.reject();

		mockFetchRichUrlData.mockImplementation( simulateFailedFetch );

		render( <LinkControl value={ selectedLink } hasRichPreviews /> );

		const linkPreview = screen.getByLabelText( 'Currently selected' );

		expect( linkPreview ).toHaveClass( 'is-fetching' );

		await waitFor( () =>
			expect( linkPreview ).not.toHaveClass( 'is-fetching' )
		);

		expect( linkPreview ).not.toHaveClass( 'is-rich' );
	} );

	afterAll( () => {
		// Remove the mock to avoid edge cases in other tests.
		mockFetchRichUrlData = undefined;
	} );
} );

describe( 'Controlling link title text', () => {
	const selectedLink = fauxEntitySuggestions[ 0 ];

	it( 'should not show a means to alter the link title text by default', async () => {
		render( <LinkControl value={ selectedLink } forceIsEditingLink /> );

		expect(
			screen.queryByRole( 'textbox', { name: 'Text' } )
		).not.toBeInTheDocument();
	} );

	it.each( [ null, undefined, '   ' ] )(
		'should not show the link title text input when the URL is `%s`',
		async ( urlValue ) => {
			const selectedLinkWithoutURL = {
				...fauxEntitySuggestions[ 0 ],
				url: urlValue,
			};

			render(
				<LinkControl
					value={ selectedLinkWithoutURL }
					forceIsEditingLink
					hasTextControl
				/>
			);

			expect(
				screen.queryByRole( 'textbox', { name: 'Text' } )
			).not.toBeInTheDocument();
		}
	);

	it( 'should show a text input to alter the link title text when hasTextControl prop is truthy', async () => {
		render(
			<LinkControl
				value={ selectedLink }
				forceIsEditingLink
				hasTextControl
			/>
		);

		const user = userEvent.setup();

		await toggleSettingsDrawer( user );

		expect(
			screen.queryByRole( 'textbox', { name: 'Text' } )
		).toBeVisible();
	} );

	it.each( [
		[ '', 'Testing' ],
		[ '(with leading and traling whitespace)', '    Testing    ' ],
		[
			// Note: link control should always preserve the original value.
			// The consumer is responsible for filtering or otherwise handling the value.
			'(when containing HTML)',
			'<strong>Yes this</strong> <em>is</em> expected behaviour',
		],
	] )(
		"should ensure text input reflects the current link value's `title` property %s",
		async ( _unused, titleValue ) => {
			const linkWithTitle = { ...selectedLink, title: titleValue };
			render(
				<LinkControl
					value={ linkWithTitle }
					forceIsEditingLink
					hasTextControl
				/>
			);

			const user = userEvent.setup();

			await toggleSettingsDrawer( user );

			const textInput = screen.queryByRole( 'textbox', {
				name: 'Text',
			} );

			expect( textInput ).toHaveValue( titleValue );
		}
	);

	it( "should ensure title value matching the text input's current value is included in onChange handler value on submit", async () => {
		const user = userEvent.setup();
		const mockOnChange = jest.fn();
		const textValue = 'My new text value';

		render(
			<LinkControl
				value={ selectedLink }
				forceIsEditingLink
				hasTextControl
				onChange={ mockOnChange }
			/>
		);

		await toggleSettingsDrawer( user );

		const textInput = screen.queryByRole( 'textbox', { name: 'Text' } );

		await user.clear( textInput );
		await user.keyboard( textValue );

		expect( textInput ).toHaveValue( textValue );

		const submitButton = screen.queryByRole( 'button', {
			name: 'Apply',
		} );

		await user.click( submitButton );

		expect( mockOnChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				title: textValue,
			} )
		);
	} );

	it( 'should allow `ENTER` keypress within the text field to trigger submission of value', async () => {
		const user = userEvent.setup();
		const textValue = 'My new text value';
		const mockOnChange = jest.fn();

		render(
			<LinkControl
				value={ selectedLink }
				forceIsEditingLink
				hasTextControl
				onChange={ mockOnChange }
			/>
		);

		await toggleSettingsDrawer( user );

		const textInput = screen.queryByRole( 'textbox', { name: 'Text' } );

		expect( textInput ).toBeVisible();

		await user.clear( textInput );
		await user.keyboard( textValue );

		// Attempt to submit the empty search value in the input.
		triggerEnter( textInput );

		expect( mockOnChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				title: textValue,
				url: selectedLink.url,
			} )
		);

		// The text input should not be showing as the form is submitted.
		expect(
			screen.queryByRole( 'textbox', { name: 'Text' } )
		).not.toBeInTheDocument();
	} );
} );

async function toggleSettingsDrawer( user ) {
	const settingsToggle = screen.queryByRole( 'button', {
		name: 'Link Settings',
	} );

	await user.click( settingsToggle );
}
