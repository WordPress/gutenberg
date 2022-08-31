/**
 * External dependencies
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * WordPress dependencies
 */
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

// Mock debounce() so that it runs instantly.
jest.mock( 'lodash', () => ( {
	...jest.requireActual( 'lodash' ),
	debounce: ( fn ) => {
		fn.cancel = jest.fn();
		return fn;
	},
} ) );

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

jest.useRealTimers();

/**
 * Wait for next tick of event loop. This is required
 * because the `fetchSearchSuggestions` Promise will
 * resolve on the next tick of the event loop (this is
 * inline with the Promise spec). As a result we need to
 * wait on this loop to "tick" before we can expect the UI
 * to have updated.
 */
function eventLoopTick() {
	return new Promise( ( resolve ) => setImmediate( resolve ) );
}

beforeEach( () => {
	// Setup a DOM element as a render target.
	mockFetchSearchSuggestions.mockImplementation( fetchFauxEntitySuggestions );
} );

afterEach( () => {
	// Cleanup on exiting.
	mockFetchSearchSuggestions.mockReset();
	mockFetchRichUrlData?.mockReset(); // Conditionally reset as it may NOT be a mock.
} );

function getURLInput() {
	return screen.queryByRole( 'combobox', { name: 'URL' } );
}

function getSearchResults( container ) {
	const input = getURLInput();
	// The input has `aria-controls` to indicate that it owns (and is related to)
	// the search results with `role="listbox"`.
	const relatedSelector = input.getAttribute( 'aria-controls' );

	// Select by relationship as well as role.
	return container.querySelectorAll(
		`#${ relatedSelector }[role="listbox"] [role="option"]`
	);
}

function getCurrentLink() {
	return screen.queryByLabelText( 'Currently selected' );
}

function getSelectedResultElement() {
	return screen.queryByRole( 'option', { selected: true } );
}

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
		const searchInput = getURLInput();

		expect( searchInput ).toBeInTheDocument();
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
		const searchInput = getURLInput();

		// Simulate searching for a term.
		searchInput.focus();
		await user.keyboard( searchTerm );

		expect( screen.queryByText( '://' ) ).not.toBeInTheDocument();
	} );

	describe( 'forceIsEditingLink', () => {
		it( 'undefined', () => {
			render( <LinkControl value={ { url: 'https://example.com' } } /> );

			expect( getURLInput() ).not.toBeInTheDocument();
		} );

		it( 'true', () => {
			render(
				<LinkControl
					value={ { url: 'https://example.com' } }
					forceIsEditingLink
				/>
			);

			expect( getURLInput() ).toBeVisible();
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

			expect( getURLInput() ).toBeVisible();

			// If passed `forceIsEditingLink` of `false` while editing, should
			// forcefully reset to the preview state.
			rerender(
				<LinkControl
					value={ { url: 'https://example.com' } }
					forceIsEditingLink={ false }
				/>
			);

			expect( getURLInput() ).not.toBeInTheDocument();
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

			const linkPreview = getCurrentLink();

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

		const fauxRequest = () =>
			new Promise( ( resolve ) => {
				resolver = resolve;
			} );

		mockFetchSearchSuggestions.mockImplementation( fauxRequest );

		const { container } = render( <LinkControl /> );

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		searchInput.focus();
		await user.keyboard( searchTerm );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
		await eventLoopTick();

		const searchResultElements = getSearchResults( container );

		let loadingUI = screen.queryByRole( 'presentation' );

		expect( searchResultElements ).toHaveLength( 0 );

		expect( loadingUI ).toBeVisible();

		act( () => {
			resolver( fauxEntitySuggestions );
		} );

		await eventLoopTick();

		loadingUI = screen.queryByRole( 'presentation' );

		expect( loadingUI ).not.toBeInTheDocument();
	} );

	it( 'should display only search suggestions when current input value is not URL-like', async () => {
		const user = userEvent.setup();
		const searchTerm = 'Hello world';
		const firstFauxSuggestion = fauxEntitySuggestions[ 0 ];

		const { container } = render( <LinkControl /> );

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		searchInput.focus();
		await user.keyboard( searchTerm );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
		await eventLoopTick();

		const searchResultElements = getSearchResults( container );

		expect( searchResultElements ).toHaveLength(
			fauxEntitySuggestions.length
		);

		expect( searchInput.getAttribute( 'aria-expanded' ) ).toBe( 'true' );

		// Sanity check that a search suggestion shows up corresponding to the data.
		expect( searchResultElements[ 0 ] ).toHaveTextContent(
			firstFauxSuggestion.title
		);
		expect( searchResultElements[ 0 ] ).toHaveTextContent(
			firstFauxSuggestion.type
		);

		// The fallback URL suggestion should not be shown when input is not URL-like.
		expect(
			searchResultElements[ searchResultElements.length - 1 ]
		).not.toHaveTextContent( 'URL' );
	} );

	it( 'should trim search term', async () => {
		const user = userEvent.setup();
		const searchTerm = '   Hello    ';

		const { container } = render( <LinkControl /> );

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		searchInput.focus();
		await user.keyboard( searchTerm );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
		await eventLoopTick();

		const searchResultTextHighlightElements = Array.from(
			container.querySelectorAll(
				'[role="listbox"] button[role="option"] mark'
			)
		);

		const invalidResults = searchResultTextHighlightElements.find(
			( mark ) => mark.innerHTML !== 'Hello'
		);

		// Given we're mocking out the results we should always have 4 mark elements.
		expect( searchResultTextHighlightElements ).toHaveLength( 4 );

		// Make sure there are no `mark` elements which contain anything other
		// than the trimmed search term (ie: no whitespace).
		expect( invalidResults ).toBeFalsy();

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
		const { container } = render(
			<LinkControl showSuggestions={ false } />
		);

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		searchInput.focus();
		await user.keyboard( 'anything' );

		const searchResultElements = getSearchResults( container );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
		await eventLoopTick();

		expect( searchResultElements ).toHaveLength( 0 );
		expect( mockFetchSearchSuggestions ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ 'couldbeurlorentitysearchterm' ],
		[ 'ThisCouldAlsoBeAValidURL' ],
	] )(
		'should display a URL suggestion as a default fallback for the search term "%s" which could potentially be a valid url.',
		async ( searchTerm ) => {
			const user = userEvent.setup();
			const { container } = render( <LinkControl /> );

			// Search Input UI.
			const searchInput = getURLInput();

			// Simulate searching for a term.
			searchInput.focus();
			await user.keyboard( searchTerm );

			// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
			await eventLoopTick();

			const searchResultElements = getSearchResults( container );

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
		const { container } = render( <LinkControl noURLSuggestion /> );

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		searchInput.focus();
		await user.keyboard( 'couldbeurlorentitysearchterm' );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
		await eventLoopTick();

		const searchResultElements = getSearchResults( container );

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
			const { container } = render( <LinkControl /> );

			// Search Input UI.
			const searchInput = getURLInput();

			// Simulate searching for a term.
			searchInput.focus();
			await user.keyboard( searchTerm );

			// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
			await eventLoopTick();

			const searchResultElements = getSearchResults( container );

			expect( searchResultElements ).toHaveLength( 1 );
			expect( searchResultElements[ 0 ] ).toHaveTextContent( searchTerm );
			expect( searchResultElements[ 0 ] ).toHaveTextContent( 'URL' );
			expect( searchResultElements[ 0 ] ).toHaveTextContent(
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
				const searchInput = getURLInput();

				let submitButton = screen.queryByRole( 'button', {
					name: 'Submit',
				} );

				expect( submitButton ).toBeDisabled();
				expect( submitButton ).toBeVisible();

				searchInput.focus();
				if ( searchString.length ) {
					// Simulate searching for a term.
					await user.keyboard( searchString );
				} else {
					// Simulate clearing the search term.
					await userEvent.clear( searchInput );
				}

				// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
				await eventLoopTick();

				// Attempt to submit the empty search value in the input.
				await user.keyboard( '[Enter]' );

				submitButton = screen.queryByRole( 'button', {
					name: 'Submit',
				} );

				// Verify the UI hasn't allowed submission.
				expect( searchInput ).toBeInTheDocument();
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
				const searchInput = getURLInput();

				let submitButton = screen.queryByRole( 'button', {
					name: 'Submit',
				} );

				expect( submitButton ).toBeDisabled();
				expect( submitButton ).toBeVisible();

				// Simulate searching for a term.
				searchInput.focus();
				if ( searchString.length ) {
					// Simulate searching for a term.
					await user.keyboard( searchString );
				} else {
					// Simulate clearing the search term.
					await userEvent.clear( searchInput );
				}

				// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
				await eventLoopTick();

				// Attempt to submit the empty search value in the input.
				await user.click( submitButton );

				submitButton = screen.queryByRole( 'button', {
					name: 'Submit',
				} );

				// Verify the UI hasn't allowed submission.
				expect( searchInput ).toBeInTheDocument();
				expect( submitButton ).toBeDisabled();
				expect( submitButton ).toBeVisible();
			}
		);
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
				const { container } = render( <LinkControl /> );

				// Search Input UI.
				const searchInput = getURLInput();

				// Simulate searching for a term.
				searchInput.focus();
				await user.keyboard( searchTerm );

				// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
				await eventLoopTick();

				const searchResultElements = getSearchResults( container );

				expect( searchResultElements ).toHaveLength( 1 );
				expect( searchResultElements[ 0 ] ).toHaveTextContent(
					searchTerm
				);
				expect( searchResultElements[ 0 ] ).toHaveTextContent(
					searchType
				);
				expect( searchResultElements[ 0 ] ).toHaveTextContent(
					'Press ENTER to add this link'
				);
			}
		);
	} );
} );

describe( 'Default search suggestions', () => {
	it( 'should display a list of initial search suggestions when there is no search value or suggestions', async () => {
		const expectedResultsLength = 3; // Set within `LinkControl`.

		render( <LinkControl showInitialSuggestions /> );

		await eventLoopTick();

		expect(
			screen.queryByRole( 'listbox', {
				name: 'Recently updated',
			} )
		).toBeVisible();

		// Verify input has no value has default suggestions should only show
		// when this does not have a value.
		// Search Input UI.
		expect( getURLInput() ).toHaveValue( '' );

		// Ensure only called once as a guard against potential infinite
		// re-render loop within `componentDidUpdate` calling `updateSuggestions`
		// which has calls to `setState` within it.
		expect( mockFetchSearchSuggestions ).toHaveBeenCalledTimes( 1 );

		// Verify the search results already display the initial suggestions.
		expect( screen.queryAllByRole( 'option' ) ).toHaveLength(
			expectedResultsLength
		);
	} );

	it( 'should not display initial suggestions when input value is present', async () => {
		const user = userEvent.setup();

		// Render with an initial value an ensure that no initial suggestions
		// are shown.
		const { container } = render(
			<LinkControl
				showInitialSuggestions
				value={ fauxEntitySuggestions[ 0 ] }
			/>
		);

		await eventLoopTick();

		expect( mockFetchSearchSuggestions ).not.toHaveBeenCalled();

		// Click the "Edit/Change" button and check initial suggestions are not
		// shown.
		const currentLinkUI = getCurrentLink();
		const currentLinkBtn = currentLinkUI.querySelector( 'button' );

		await user.click( currentLinkBtn );

		const searchInput = getURLInput();
		searchInput.focus();

		await eventLoopTick();

		const searchResultElements = getSearchResults( container );

		// Search input is set to the URL value.
		expect( searchInput ).toHaveValue( fauxEntitySuggestions[ 0 ].url );

		// It should match any url that's like ?p= and also include a URL option.
		expect( searchResultElements ).toHaveLength( 5 );

		expect( searchInput ).toHaveAttribute( 'aria-expanded', 'true' );

		expect( mockFetchSearchSuggestions ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should display initial suggestions when input value is manually deleted', async () => {
		const user = userEvent.setup();
		const searchTerm = 'Hello world';

		const { container } = render( <LinkControl showInitialSuggestions /> );

		let searchResultElements;
		let searchInput;

		// Search Input UI.
		searchInput = getURLInput();

		// Simulate searching for a term.
		searchInput.focus();
		await user.keyboard( searchTerm );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
		await eventLoopTick();

		expect( searchInput ).toHaveValue( searchTerm );

		searchResultElements = getSearchResults( container );

		// Delete the text.
		await userEvent.clear( searchInput );

		await eventLoopTick();

		searchResultElements = getSearchResults( container );

		searchInput = getURLInput();

		// Check the input is empty now.
		expect( searchInput ).toHaveValue( '' );

		expect(
			screen.queryByRole( 'listbox', {
				name: 'Recently updated',
			} )
		).toBeVisible();

		expect( searchResultElements ).toHaveLength( 3 );
	} );

	it( 'should not display initial suggestions when there are no recently updated pages/posts', async () => {
		const noResults = [];
		// Force API returning empty results for recently updated Pages.
		mockFetchSearchSuggestions.mockImplementation( () =>
			Promise.resolve( noResults )
		);

		const { container } = render( <LinkControl showInitialSuggestions /> );

		await eventLoopTick();

		const searchInput = getURLInput();

		const searchResultElements = getSearchResults( container );

		const searchResultLabel = container.querySelector(
			'.block-editor-link-control__search-results-label'
		);

		expect( searchResultLabel ).not.toBeInTheDocument();

		expect( searchResultElements ).toHaveLength( 0 );

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
			let resolvedEntity;

			const createSuggestion = ( title ) =>
				new Promise( ( resolve ) => {
					resolver = ( arg ) => {
						resolve( arg );
					};
					resolvedEntity = {
						title,
						id: 123,
						url: '/?p=123',
						type: 'page',
					};
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

			const { container } = render( <LinkControlConsumer /> );

			// Search Input UI.
			const searchInput = getURLInput();

			// Simulate searching for a term.
			searchInput.focus();
			await user.keyboard( entityNameText );

			await eventLoopTick();

			const searchResultElements = screen.queryAllByRole( 'option' );

			const createButton = Array.from( searchResultElements ).filter(
				( result ) => result.innerHTML.includes( 'Create:' )
			)[ 0 ];

			expect( createButton ).toBeVisible();
			expect( createButton ).toHaveTextContent( entityNameText );

			// No need to wait in this test because we control the Promise
			// resolution manually via the `resolver` reference.
			await user.click( createButton );

			await eventLoopTick();

			// Check for loading indicator.
			const loadingIndicator = container.querySelector(
				'.block-editor-link-control__loading'
			);
			const currentLinkLabel = getCurrentLink();

			expect( currentLinkLabel ).not.toBeInTheDocument();
			expect( loadingIndicator ).toHaveTextContent( 'Creating' );

			// Resolve the `createSuggestion` promise.
			await act( async () => {
				resolver( resolvedEntity );
			} );

			await eventLoopTick();

			const currentLink = getCurrentLink();

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

		const { container } = render( <LinkControlConsumer /> );

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		searchInput.focus();
		await user.keyboard( 'Some new page to create' );

		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
		const searchResultElements = container.querySelectorAll(
			'[role="listbox"] [role="option"]'
		);

		const createButton = Array.from( searchResultElements ).filter(
			( result ) => result.innerHTML.includes( 'Create:' )
		)[ 0 ];

		await user.click( createButton );

		await eventLoopTick();

		const currentLink = getCurrentLink();

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

		const { container } = render( <LinkControlConsumer /> );

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		searchInput.focus();
		await user.keyboard( entityNameText );

		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
		const searchResultElements = container.querySelectorAll(
			'[role="listbox"] [role="option"]'
		);
		const createButton = Array.from( searchResultElements ).filter(
			( result ) => result.innerHTML.includes( 'Create:' )
		)[ 0 ];

		// Step down into the search results, highlighting the first result item.
		triggerArrowDown( searchInput );

		createButton.focus();
		await user.keyboard( '[Enter]' );

		searchInput.focus();
		await user.keyboard( '[Enter]' );

		await eventLoopTick();

		expect( getCurrentLink() ).toHaveTextContent( entityNameText );
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

		const { container } = render( <LinkControlConsumer /> );

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		searchInput.focus();
		await user.keyboard( entityNameText );

		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
		const searchResultElements = container.querySelectorAll(
			'[role="listbox"] [role="option"]'
		);

		const createButton = Array.from( searchResultElements ).filter(
			( result ) => result.innerHTML.includes( 'Custom suggestion text' )
		)[ 0 ];

		expect( createButton ).toBeVisible();
	} );

	describe( 'Do not show create option', () => {
		it.each( [ [ undefined ], [ null ], [ false ] ] )(
			'should not show not show an option to create an entity when "createSuggestion" handler is %s',
			async ( handler ) => {
				const { container } = render(
					<LinkControl createSuggestion={ handler } />
				);

				// Await the initial suggestions to be fetched.
				await eventLoopTick();

				// Search Input UI.
				const searchInput = getURLInput();

				// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
				const searchResultElements = container.querySelectorAll(
					'[role="listbox"] [role="option"]'
				);
				const createButton = Array.from( searchResultElements ).filter(
					( result ) => result.innerHTML.includes( 'Create:' )
				)[ 0 ];

				// Verify input has no value.
				expect( searchInput ).toHaveValue( '' );
				expect( createButton ).toBeFalsy(); // Shouldn't exist!
			}
		);

		it( 'should not show not show an option to create an entity when input is empty', async () => {
			const { container } = render(
				<LinkControl
					showInitialSuggestions={ true } // Should show even if we're not showing initial suggestions.
					createSuggestion={ jest.fn() }
				/>
			);

			// Await the initial suggestions to be fetched.
			await eventLoopTick();

			// Search Input UI.
			const searchInput = getURLInput();

			// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
			const searchResultElements = container.querySelectorAll(
				'[role="listbox"] [role="option"]'
			);
			const createButton = Array.from( searchResultElements ).filter(
				( result ) => result.innerHTML.includes( 'New page' )
			)[ 0 ];

			// Verify input has no value.
			expect( searchInput ).toHaveValue( '' );
			expect( createButton ).toBeFalsy(); // Shouldn't exist!
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
				const { container } = render(
					<LinkControl createSuggestion={ jest.fn() } />
				);

				// Search Input UI.
				const searchInput = getURLInput();

				// Simulate searching for a term.
				searchInput.focus();
				await user.keyboard( inputText );

				await eventLoopTick();

				// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
				const searchResultElements = container.querySelectorAll(
					'[role="listbox"] [role="option"]'
				);

				const createButton = Array.from( searchResultElements ).filter(
					( result ) => result.innerHTML.includes( 'New page' )
				)[ 0 ];

				expect( createButton ).toBeFalsy(); // Shouldn't exist!
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

			const { container } = render(
				<LinkControl createSuggestion={ createSuggestion } />
			);

			// Search Input UI.
			searchInput = getURLInput();

			// Simulate searching for a term.
			searchInput.focus();
			await user.keyboard( searchText );

			await eventLoopTick();

			// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
			let searchResultElements = container.querySelectorAll(
				'[role="listbox"] [role="option"]'
			);
			let createButton = Array.from( searchResultElements ).filter(
				( result ) => result.innerHTML.includes( 'Create:' )
			)[ 0 ];

			await user.click( createButton );

			await eventLoopTick();

			searchInput = getURLInput();

			// This is a Notice component
			// we allow selecting by className here as an edge case because the
			// a11y is handled via `speak`.
			// See: https://github.com/WordPress/gutenberg/tree/HEAD/packages/a11y#speak.
			const errorNotice = container.querySelector(
				'.block-editor-link-control__search-error'
			);

			// Catch the error in the test to avoid test failures.
			expect( throwsError ).toThrow( Error );

			// Check human readable error notice is perceivable.
			expect( errorNotice ).toBeVisible();
			expect( errorNotice ).toHaveTextContent(
				'API response returned invalid entity'
			);

			// Verify input is repopulated with original search text.
			expect( searchInput ).toBeVisible();
			expect( searchInput ).toHaveValue( searchText );

			// Verify search results are re-shown and create button is available.
			searchResultElements = container.querySelectorAll(
				'[role="listbox"] [role="option"]'
			);
			createButton = Array.from( searchResultElements ).filter(
				( result ) => result.innerHTML.includes( 'New page' )
			)[ 0 ];
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

		const currentLink = getCurrentLink();
		const currentLinkAnchor = currentLink.querySelector(
			`[href="${ selectedLink.url }"]`
		);

		expect( currentLink ).toHaveTextContent( selectedLink.title );
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
		let currentLinkUI = getCurrentLink();
		const currentLinkBtn = currentLinkUI.querySelector( 'button' );

		// Simulate searching for a term.
		await user.click( currentLinkBtn );

		const searchInput = getURLInput();
		currentLinkUI = getCurrentLink();

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

				const { container } = render( <LinkControlConsumer /> );

				// Search Input UI.
				const searchInput = getURLInput();

				// Simulate searching for a term.
				searchInput.focus();
				await user.keyboard( searchTerm );

				// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
				await eventLoopTick();

				const searchResultElements = getSearchResults( container );

				const firstSearchSuggestion = searchResultElements[ 0 ];

				// Simulate selecting the first of the search suggestions.
				await user.click( firstSearchSuggestion );

				const currentLink = getCurrentLink();
				const currentLinkAnchor = currentLink.querySelector(
					`[href="${ selectedLink.url }"]`
				);

				// Check that this suggestion is now shown as selected.
				expect( currentLink ).toHaveTextContent( selectedLink.title );
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
				const searchInput = getURLInput();

				// Simulate searching for a term.
				searchInput.focus();
				await user.keyboard( searchTerm );

				// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
				await eventLoopTick();

				// Step down into the search results, highlighting the first result item.
				triggerArrowDown( searchInput );

				const searchResultElements = getSearchResults( container );

				const firstSearchSuggestion = searchResultElements[ 0 ];
				const secondSearchSuggestion = searchResultElements[ 1 ];

				let selectedSearchResultElement = getSelectedResultElement();

				// We should have highlighted the first item using the keyboard.
				expect( selectedSearchResultElement ).toEqual(
					firstSearchSuggestion
				);

				// Only entity searches contain more than 1 suggestion.
				if ( type === 'entity' ) {
					// Check we can go down again using the down arrow.
					triggerArrowDown( searchInput );

					selectedSearchResultElement = getSelectedResultElement();

					// We should have highlighted the first item using the keyboard
					// eslint-disable-next-line jest/no-conditional-expect
					expect( selectedSearchResultElement ).toEqual(
						secondSearchSuggestion
					);

					// Check we can go back up via up arrow.
					triggerArrowUp( searchInput );

					selectedSearchResultElement = getSelectedResultElement();

					// We should be back to highlighting the first search result again
					// eslint-disable-next-line jest/no-conditional-expect
					expect( selectedSearchResultElement ).toEqual(
						firstSearchSuggestion
					);
				}

				// Submit the selected item as the current link.
				triggerEnter( searchInput );

				// Check that the suggestion selected via is now shown as selected.
				const currentLink = getCurrentLink();
				const currentLinkAnchor = currentLink.querySelector(
					`[href="${ selectedLink.url }"]`
				);

				// Make sure focus is retained after submission.
				expect( container ).toContainElement( document.activeElement );

				expect( currentLink ).toHaveTextContent( selectedLink.title );
				expect(
					screen.getByRole( 'button', { name: 'Edit' } )
				).toBeVisible();
				expect( currentLinkAnchor ).toBeVisible();
			}
		);

		it( 'should allow selection of initial search results via the keyboard', async () => {
			const { container } = render(
				<LinkControl showInitialSuggestions />
			);

			await eventLoopTick();

			expect(
				screen.queryByRole( 'listbox', {
					name: 'Recently updated',
				} )
			).toBeVisible();

			// Search Input UI.
			const searchInput = getURLInput();

			// Step down into the search results, highlighting the first result item.
			triggerArrowDown( searchInput );

			await eventLoopTick();

			const searchResultElements = getSearchResults( container );

			const firstSearchSuggestion = searchResultElements[ 0 ];
			const secondSearchSuggestion = searchResultElements[ 1 ];

			let selectedSearchResultElement = getSelectedResultElement();

			// We should have highlighted the first item using the keyboard.
			expect( selectedSearchResultElement ).toEqual(
				firstSearchSuggestion
			);

			// Check we can go down again using the down arrow.
			triggerArrowDown( searchInput );

			selectedSearchResultElement = getSelectedResultElement();

			// We should have highlighted the first item using the keyboard.
			expect( selectedSearchResultElement ).toEqual(
				secondSearchSuggestion
			);

			// Check we can go back up via up arrow.
			triggerArrowUp( searchInput );

			selectedSearchResultElement = getSelectedResultElement();

			// We should be back to highlighting the first search result again.
			expect( selectedSearchResultElement ).toEqual(
				firstSearchSuggestion
			);

			expect( mockFetchSearchSuggestions ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );

describe( 'Addition Settings UI', () => {
	it( 'should display "New Tab" setting (in "off" mode) by default when a link is selected', async () => {
		const selectedLink = fauxEntitySuggestions[ 0 ];
		const expectedSettingText = 'Open in new tab';

		const LinkControlConsumer = () => {
			const [ link ] = useState( selectedLink );

			return <LinkControl value={ link } />;
		};

		const { container } = render( <LinkControlConsumer /> );

		const newTabSettingLabel = screen.getByText( expectedSettingText );
		expect( newTabSettingLabel ).toBeVisible();

		const newTabSettingLabelForAttr =
			newTabSettingLabel.getAttribute( 'for' );
		const newTabSettingInput = container.querySelector(
			`#${ newTabSettingLabelForAttr }`
		);
		expect( newTabSettingInput ).toBeVisible();
		expect( newTabSettingInput ).not.toBeChecked();
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
				/>
			);
		};

		render( <LinkControlConsumer /> );

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

		const { container } = render( <LinkControl /> );

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		searchInput.focus();
		await user.keyboard( searchTerm );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
		await eventLoopTick();

		const searchResultElements = getSearchResults( container );

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

			const { container } = render(
				<LinkControl suggestionsQuery={ { type: postType } } />
			);

			// Search Input UI.
			const searchInput = getURLInput();

			// Simulate searching for a term.
			searchInput.focus();
			await user.keyboard( searchTerm );

			// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
			await eventLoopTick();

			const searchResultElements = getSearchResults( container );

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

		// mockFetchRichUrlData resolves on next "tick" of event loop.
		await act( async () => {
			await eventLoopTick();
		} );

		const linkPreview = getCurrentLink();

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

		// mockFetchRichUrlData resolves on next "tick" of event loop.
		await act( async () => {
			await eventLoopTick();
		} );

		const linkPreview = getCurrentLink();

		const isRichLinkPreview = linkPreview.classList.contains( 'is-rich' );

		expect( isRichLinkPreview ).toBe( true );
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

		// mockFetchRichUrlData resolves on next "tick" of event loop.
		await act( async () => {
			await eventLoopTick();
		} );

		const linkPreview = getCurrentLink();

		// Todo: refactor to use user-facing queries.
		const hasRichImagePreview = linkPreview.querySelector(
			'.block-editor-link-control__search-item-image'
		);

		// Todo: refactor to use user-facing queries.
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

		// mockFetchRichUrlData resolves on next "tick" of event loop.
		await act( async () => {
			await eventLoopTick();
		} );

		const linkPreview = getCurrentLink();

		const isRichLinkPreview = linkPreview.classList.contains( 'is-rich' );
		expect( isRichLinkPreview ).toBe( true );

		const titlePreview = linkPreview.querySelector(
			'.block-editor-link-control__search-item-title'
		);

		expect( titlePreview ).toHaveTextContent( selectedLink.title );
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

		// mockFetchRichUrlData resolves on next "tick" of event loop.
		await act( async () => {
			await eventLoopTick();
		} );

		const linkPreview = getCurrentLink();

		const isRichLinkPreview = linkPreview.classList.contains( 'is-rich' );
		expect( isRichLinkPreview ).toBe( true );

		const iconPreview = linkPreview.querySelector(
			`.block-editor-link-control__search-item-icon`
		);

		const fallBackIcon = iconPreview.querySelector( 'svg' );
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

			// mockFetchRichUrlData resolves on next "tick" of event loop.
			await act( async () => {
				await eventLoopTick();
			} );

			const linkPreview = getCurrentLink();

			const isRichLinkPreview =
				linkPreview.classList.contains( 'is-rich' );
			expect( isRichLinkPreview ).toBe( true );

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
			mockFetchRichUrlData.mockImplementation( () =>
				Promise.resolve( data )
			);

			render( <LinkControl value={ selectedLink } hasRichPreviews /> );

			// mockFetchRichUrlData resolves on next "tick" of event loop.
			await act( async () => {
				await eventLoopTick();
			} );

			const linkPreview = getCurrentLink();

			const isRichLinkPreview =
				linkPreview.classList.contains( 'is-rich' );

			expect( isRichLinkPreview ).toBe( false );
		}
	);

	it( 'should display in loading state when rich data is being fetched', async () => {
		const nonResolvingPromise = () => new Promise( () => {} );

		mockFetchRichUrlData.mockImplementation( nonResolvingPromise );

		render( <LinkControl value={ selectedLink } hasRichPreviews /> );

		// mockFetchRichUrlData resolves on next "tick" of event loop.
		await act( async () => {
			await eventLoopTick();
		} );

		const linkPreview = getCurrentLink();

		const isFetchingRichPreview =
			linkPreview.classList.contains( 'is-fetching' );
		const isRichLinkPreview = linkPreview.classList.contains( 'is-rich' );

		expect( isFetchingRichPreview ).toBe( true );
		expect( isRichLinkPreview ).toBe( false );
	} );

	it( 'should remove fetching UI indicators and fallback to standard preview if request for rich preview results in an error', async () => {
		const simulateFailedFetch = () => Promise.reject();

		mockFetchRichUrlData.mockImplementation( simulateFailedFetch );

		render( <LinkControl value={ selectedLink } hasRichPreviews /> );

		// mockFetchRichUrlData resolves on next "tick" of event loop.
		await act( async () => {
			await eventLoopTick();
		} );

		const linkPreview = getCurrentLink();

		const isFetchingRichPreview =
			linkPreview.classList.contains( 'is-fetching' );

		const isRichLinkPreview = linkPreview.classList.contains( 'is-rich' );

		expect( isFetchingRichPreview ).toBe( false );
		expect( isRichLinkPreview ).toBe( false );
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

		const textInput = screen.queryByRole( 'textbox', { name: 'Text' } );

		textInput.focus();
		await userEvent.clear( textInput );
		await user.keyboard( textValue );

		expect( textInput ).toHaveValue( textValue );

		const submitButton = screen.queryByRole( 'button', {
			name: 'Submit',
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

		const textInput = screen.queryByRole( 'textbox', { name: 'Text' } );

		expect( textInput ).toBeVisible();

		textInput.focus();
		await userEvent.clear( textInput );
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
