/**
 * External dependencies
 */
import { render, unmountComponentAtNode } from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import { queryByText, queryByRole } from '@testing-library/react';
import { default as lodash, first, last, nth, uniqueId } from 'lodash';
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { UP, DOWN, ENTER } from '@wordpress/keycodes';
/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import LinkControl from '../';
import { fauxEntitySuggestions, fetchFauxEntitySuggestions } from './fixtures';

// Mock debounce() so that it runs instantly.
lodash.debounce = jest.fn( ( callback ) => {
	callback.cancel = jest.fn();
	return callback;
} );

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

let container = null;

beforeEach( () => {
	// Setup a DOM element as a render target.
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	mockFetchSearchSuggestions.mockImplementation( fetchFauxEntitySuggestions );
} );

afterEach( () => {
	// Cleanup on exiting.
	unmountComponentAtNode( container );
	container.remove();
	container = null;
	mockFetchSearchSuggestions.mockReset();
	mockFetchRichUrlData?.mockReset(); // Conditionally reset as it may NOT be a mock.
} );

function getURLInput() {
	return container.querySelector( 'input[aria-label="URL"]' );
}

function getSearchResults() {
	const input = getURLInput();
	// The input has `aria-owns` to indicate that it owns (and is related to)
	// the search results with `role="listbox"`.
	const relatedSelector = input.getAttribute( 'aria-owns' );

	// Select by relationship as well as role.
	return container.querySelectorAll(
		`#${ relatedSelector }[role="listbox"] [role="option"]`
	);
}

function getCurrentLink() {
	return container.querySelector(
		'.block-editor-link-control__search-item.is-current'
	);
}

describe( 'Basic rendering', () => {
	it( 'should render', () => {
		act( () => {
			render( <LinkControl />, container );
		} );

		// Search Input UI.
		const searchInput = getURLInput();

		expect( searchInput ).not.toBeNull();
	} );

	it( 'should not render protocol in links', async () => {
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

		act( () => {
			render( <LinkControl />, container );
		} );

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		act( () => {
			Simulate.change( searchInput, { target: { value: searchTerm } } );
		} );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
		await eventLoopTick();

		// Find all elements with link
		// Filter out the element with the text 'ENTER' because it doesn't contain link.
		const linkElements = Array.from(
			container.querySelectorAll(
				'.block-editor-link-control__search-item-info'
			)
		).filter( ( elem ) => ! elem.innerHTML.includes( 'ENTER' ) );

		linkElements.forEach( ( elem ) => {
			expect( elem.innerHTML ).not.toContain( '://' );
		} );
	} );

	describe( 'forceIsEditingLink', () => {
		const isEditing = () => !! getURLInput();

		it( 'undefined', () => {
			act( () => {
				render(
					<LinkControl value={ { url: 'https://example.com' } } />,
					container
				);
			} );

			expect( isEditing() ).toBe( false );
		} );

		it( 'true', () => {
			act( () => {
				render(
					<LinkControl
						value={ { url: 'https://example.com' } }
						forceIsEditingLink
					/>,
					container
				);
			} );

			expect( isEditing() ).toBe( true );
		} );

		it( 'false', () => {
			act( () => {
				render(
					<LinkControl value={ { url: 'https://example.com' } } />,
					container
				);
			} );

			// Click the "Edit" button to trigger into the editing mode.
			const editButton = queryByRole( container, 'button', {
				name: 'Edit',
			} );

			act( () => {
				Simulate.click( editButton );
			} );

			expect( isEditing() ).toBe( true );

			// If passed `forceIsEditingLink` of `false` while editing, should
			// forcefully reset to the preview state.
			act( () => {
				render(
					<LinkControl
						value={ { url: 'https://example.com' } }
						forceIsEditingLink={ false }
					/>,
					container
				);
			} );

			expect( isEditing() ).toBe( false );
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

			act( () => {
				render(
					<LinkControl
						value={ valueWithEmptyURL }
						forceIsEditingLink={ false }
					/>,
					container
				);
			} );

			const linkPreview = queryByRole( container, 'generic', {
				name: 'Currently selected',
			} );

			const isPreviewError = linkPreview.classList.contains( 'is-error' );
			expect( isPreviewError ).toBe( true );

			expect( queryByText( linkPreview, 'Link is empty' ) ).toBeTruthy();
		} );
	} );

	describe( 'Unlinking', () => {
		it( 'should not show "Unlink" button if no onRemove handler is provided', () => {
			act( () => {
				render(
					<LinkControl value={ { url: 'https://example.com' } } />,
					container
				);
			} );

			const unLinkButton = queryByRole( container, 'button', {
				name: 'Unlink',
			} );

			expect( unLinkButton ).toBeNull();
			expect( unLinkButton ).not.toBeInTheDocument();
		} );

		it( 'should show "Unlink" button if a onRemove handler is provided', () => {
			const mockOnRemove = jest.fn();
			act( () => {
				render(
					<LinkControl
						value={ { url: 'https://example.com' } }
						onRemove={ mockOnRemove }
					/>,
					container
				);
			} );

			const unLinkButton = queryByRole( container, 'button', {
				name: 'Unlink',
			} );
			expect( unLinkButton ).toBeTruthy();
			expect( unLinkButton ).toBeInTheDocument();

			act( () => {
				Simulate.click( unLinkButton );
			} );

			expect( mockOnRemove ).toHaveBeenCalled();
		} );
	} );
} );

describe( 'Searching for a link', () => {
	it( 'should display loading UI when input is valid but search results have yet to be returned', async () => {
		const searchTerm = 'Hello';

		let resolver;

		const fauxRequest = () =>
			new Promise( ( resolve ) => {
				resolver = resolve;
			} );

		mockFetchSearchSuggestions.mockImplementation( fauxRequest );

		act( () => {
			render( <LinkControl />, container );
		} );

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		act( () => {
			Simulate.change( searchInput, { target: { value: searchTerm } } );
		} );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
		await eventLoopTick();

		const searchResultElements = getSearchResults();

		let loadingUI = container.querySelector( '.components-spinner' );

		expect( searchResultElements ).toHaveLength( 0 );

		expect( loadingUI ).not.toBeNull();

		act( () => {
			resolver( fauxEntitySuggestions );
		} );

		await eventLoopTick();

		loadingUI = container.querySelector( '.components-spinner' );

		expect( loadingUI ).toBeNull();
	} );

	it( 'should display only search suggestions when current input value is not URL-like', async () => {
		const searchTerm = 'Hello world';
		const firstFauxSuggestion = first( fauxEntitySuggestions );

		act( () => {
			render( <LinkControl />, container );
		} );

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		act( () => {
			Simulate.change( searchInput, { target: { value: searchTerm } } );
		} );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
		await eventLoopTick();
		// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.

		const searchResultElements = getSearchResults();

		const firstSearchResultItemHTML = first( searchResultElements )
			.innerHTML;
		const lastSearchResultItemHTML = last( searchResultElements ).innerHTML;

		expect( searchResultElements ).toHaveLength(
			fauxEntitySuggestions.length
		);

		expect( searchInput.getAttribute( 'aria-expanded' ) ).toBe( 'true' );

		// Sanity check that a search suggestion shows up corresponding to the data.
		expect( firstSearchResultItemHTML ).toEqual(
			expect.stringContaining( firstFauxSuggestion.title )
		);
		expect( firstSearchResultItemHTML ).toEqual(
			expect.stringContaining( firstFauxSuggestion.type )
		);

		// The fallback URL suggestion should not be shown when input is not URL-like.
		expect( lastSearchResultItemHTML ).not.toEqual(
			expect.stringContaining( 'URL' )
		);
	} );

	it( 'should trim search term', async () => {
		const searchTerm = '   Hello    ';

		act( () => {
			render( <LinkControl />, container );
		} );

		// Search Input UI.
		const searchInput = container.querySelector(
			'input[aria-label="URL"]'
		);

		// Simulate searching for a term.
		act( () => {
			Simulate.change( searchInput, { target: { value: searchTerm } } );
		} );

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

		// Grab the first argument that was passed to the fetchSuggestions
		// handler (which is mocked out).
		const mockFetchSuggestionsFirstArg =
			mockFetchSearchSuggestions.mock.calls[ 0 ][ 0 ];

		// Given we're mocking out the results we should always have 4 mark elements.
		expect( searchResultTextHighlightElements ).toHaveLength( 4 );

		// Make sure there are no `mark` elements which contain anything other
		// than the trimmed search term (ie: no whitespace).
		expect( invalidResults ).toBeFalsy();

		// Implementation detail test to ensure that the fetch handler is called
		// with the trimmed search value. We do this because we are mocking out
		// the fetch handler in our test so we need to assert it would be called
		// correctly in a real world scenario.
		expect( mockFetchSuggestionsFirstArg ).toEqual( 'Hello' );
	} );

	it( 'should not call search handler when showSuggestions is false', async () => {
		act( () => {
			render( <LinkControl showSuggestions={ false } />, container );
		} );

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		act( () => {
			Simulate.change( searchInput, {
				target: { value: 'anything' },
			} );
		} );

		const searchResultElements = getSearchResults();

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
		expect( searchResultElements ).toHaveLength( 0 );
		expect( mockFetchSearchSuggestions ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ 'couldbeurlorentitysearchterm' ],
		[ 'ThisCouldAlsoBeAValidURL' ],
	] )(
		'should display a URL suggestion as a default fallback for the search term "%s" which could potentially be a valid url.',
		async ( searchTerm ) => {
			act( () => {
				render( <LinkControl />, container );
			} );

			// Search Input UI.
			const searchInput = getURLInput();

			// Simulate searching for a term.
			act( () => {
				Simulate.change( searchInput, {
					target: { value: searchTerm },
				} );
			} );

			// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
			await eventLoopTick();
			// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.

			const searchResultElements = getSearchResults();

			const lastSearchResultItemHTML = last( searchResultElements )
				.innerHTML;
			const additionalDefaultFallbackURLSuggestionLength = 1;

			// We should see a search result for each of the expect search suggestions
			// plus 1 additional one for the fallback URL suggestion.
			expect( searchResultElements ).toHaveLength(
				fauxEntitySuggestions.length +
					additionalDefaultFallbackURLSuggestionLength
			);

			// The last item should be a URL search suggestion.
			expect( lastSearchResultItemHTML ).toEqual(
				expect.stringContaining( searchTerm )
			);
			expect( lastSearchResultItemHTML ).toEqual(
				expect.stringContaining( 'URL' )
			);
			expect( lastSearchResultItemHTML ).toEqual(
				expect.stringContaining( 'Press ENTER to add this link' )
			);
		}
	);

	it( 'should not display a URL suggestion as a default fallback when noURLSuggestion is passed.', async () => {
		act( () => {
			render( <LinkControl noURLSuggestion />, container );
		} );

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		act( () => {
			Simulate.change( searchInput, {
				target: { value: 'couldbeurlorentitysearchterm' },
			} );
		} );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
		await eventLoopTick();
		// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.

		const searchResultElements = getSearchResults();

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
			act( () => {
				render( <LinkControl />, container );
			} );

			// Search Input UI.
			const searchInput = getURLInput();

			// Simulate searching for a term.
			act( () => {
				Simulate.change( searchInput, {
					target: { value: searchTerm },
				} );
			} );

			// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
			await eventLoopTick();

			const searchResultElements = getSearchResults();

			const firstSearchResultItemHTML =
				searchResultElements[ 0 ].innerHTML;
			const expectedResultsLength = 1;

			expect( searchResultElements ).toHaveLength(
				expectedResultsLength
			);
			expect( firstSearchResultItemHTML ).toEqual(
				expect.stringContaining( searchTerm )
			);
			expect( firstSearchResultItemHTML ).toEqual(
				expect.stringContaining( 'URL' )
			);
			expect( firstSearchResultItemHTML ).toEqual(
				expect.stringContaining( 'Press ENTER to add this link' )
			);
		}
	);

	describe( 'Handling of empty values', () => {
		const testTable = [
			[ 'containing only spaces', '        ' ],
			[ 'containing only tabs', '		' ],
			[ 'from strings with no length', '' ],
		];

		it.each( testTable )(
			'should not allow creation of links %s when using the keyboard',
			async ( _desc, searchString ) => {
				act( () => {
					render( <LinkControl />, container );
				} );

				// Search Input UI.
				const searchInput = getURLInput();

				let submitButton = queryByRole( container, 'button', {
					name: 'Submit',
				} );

				expect( submitButton.disabled ).toBeTruthy();
				expect( submitButton ).not.toBeNull();
				expect( submitButton ).toBeInTheDocument();

				// Simulate searching for a term.
				act( () => {
					Simulate.change( searchInput, {
						target: { value: searchString },
					} );
				} );

				// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
				await eventLoopTick();

				// Attempt to submit the empty search value in the input.
				act( () => {
					Simulate.keyDown( searchInput, { keyCode: ENTER } );
				} );

				submitButton = queryByRole( container, 'button', {
					name: 'Submit',
				} );

				// Verify the UI hasn't allowed submission.
				expect( searchInput ).toBeInTheDocument();
				expect( submitButton.disabled ).toBeTruthy();
				expect( submitButton ).not.toBeNull();
				expect( submitButton ).toBeInTheDocument();
			}
		);

		it.each( testTable )(
			'should not allow creation of links %s via the UI "submit" button',
			async ( _desc, searchString ) => {
				act( () => {
					render( <LinkControl />, container );
				} );

				// Search Input UI.
				const searchInput = getURLInput();

				let submitButton = queryByRole( container, 'button', {
					name: 'Submit',
				} );

				expect( submitButton.disabled ).toBeTruthy();
				expect( submitButton ).not.toBeNull();
				expect( submitButton ).toBeInTheDocument();

				// Simulate searching for a term.
				act( () => {
					Simulate.change( searchInput, {
						target: { value: searchString },
					} );
				} );

				// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
				await eventLoopTick();

				// Attempt to submit the empty search value in the input.
				act( () => {
					Simulate.click( submitButton );
				} );

				submitButton = queryByRole( container, 'button', {
					name: 'Submit',
				} );

				// Verify the UI hasn't allowed submission.
				expect( searchInput ).toBeInTheDocument();
				expect( submitButton.disabled ).toBeTruthy();
				expect( submitButton ).not.toBeNull();
				expect( submitButton ).toBeInTheDocument();
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
				act( () => {
					render( <LinkControl />, container );
				} );

				// Search Input UI.
				const searchInput = getURLInput();

				// Simulate searching for a term.
				act( () => {
					Simulate.change( searchInput, {
						target: { value: searchTerm },
					} );
				} );

				// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
				await eventLoopTick();

				const searchResultElements = getSearchResults();

				const firstSearchResultItemHTML =
					searchResultElements[ 0 ].innerHTML;
				const expectedResultsLength = 1;

				expect( searchResultElements ).toHaveLength(
					expectedResultsLength
				);
				expect( firstSearchResultItemHTML ).toEqual(
					expect.stringContaining( searchTerm )
				);
				expect( firstSearchResultItemHTML ).toEqual(
					expect.stringContaining( searchType )
				);
				expect( firstSearchResultItemHTML ).toEqual(
					expect.stringContaining( 'Press ENTER to add this link' )
				);
			}
		);
	} );
} );

describe( 'Default search suggestions', () => {
	it( 'should display a list of initial search suggestions when there is no search value or suggestions', async () => {
		const expectedResultsLength = 3; // Set within `LinkControl`.

		act( () => {
			render( <LinkControl showInitialSuggestions />, container );
		} );

		await eventLoopTick();

		// Search Input UI.
		const searchInput = getURLInput();

		const searchResultsWrapper = container.querySelector(
			'[role="listbox"]'
		);
		const initialSearchResultElements = searchResultsWrapper.querySelectorAll(
			'[role="option"]'
		);

		const searchResultsLabel = container.querySelector(
			`#${ searchResultsWrapper.getAttribute( 'aria-labelledby' ) }`
		);

		// Verify input has no value has default suggestions should only show
		// when this does not have a value.
		expect( searchInput.value ).toBe( '' );

		// Ensure only called once as a guard against potential infinite
		// re-render loop within `componentDidUpdate` calling `updateSuggestions`
		// which has calls to `setState` within it.
		expect( mockFetchSearchSuggestions ).toHaveBeenCalledTimes( 1 );

		// Verify the search results already display the initial suggestions.
		expect( initialSearchResultElements ).toHaveLength(
			expectedResultsLength
		);

		expect( searchResultsLabel.innerHTML ).toEqual( 'Recently updated' );
	} );

	it( 'should not display initial suggestions when input value is present', async () => {
		// Render with an initial value an ensure that no initial suggestions
		// are shown.
		act( () => {
			render(
				<LinkControl
					showInitialSuggestions
					value={ fauxEntitySuggestions[ 0 ] }
				/>,
				container
			);
		} );

		await eventLoopTick();

		expect( mockFetchSearchSuggestions ).not.toHaveBeenCalled();

		// Click the "Edit/Change" button and check initial suggestions are not
		// shown.
		const currentLinkUI = getCurrentLink();
		const currentLinkBtn = currentLinkUI.querySelector( 'button' );

		act( () => {
			Simulate.click( currentLinkBtn );
		} );

		const searchInput = getURLInput();
		searchInput.focus();

		await eventLoopTick();

		const searchResultElements = getSearchResults();

		// Search input is set to the URL value.
		expect( searchInput.value ).toEqual( fauxEntitySuggestions[ 0 ].url );

		// It should match any url that's like ?p= and also include a URL option.
		expect( searchResultElements ).toHaveLength( 5 );

		expect( searchInput.getAttribute( 'aria-expanded' ) ).toBe( 'true' );

		expect( mockFetchSearchSuggestions ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should display initial suggestions when input value is manually deleted', async () => {
		const searchTerm = 'Hello world';

		act( () => {
			render( <LinkControl showInitialSuggestions />, container );
		} );

		let searchResultElements;
		let searchInput;

		// Search Input UI.
		searchInput = getURLInput();

		// Simulate searching for a term.
		act( () => {
			Simulate.change( searchInput, { target: { value: searchTerm } } );
		} );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
		await eventLoopTick();

		expect( searchInput.value ).toBe( searchTerm );

		searchResultElements = getSearchResults();

		// Delete the text.
		act( () => {
			Simulate.change( searchInput, { target: { value: '' } } );
		} );

		await eventLoopTick();

		searchResultElements = getSearchResults();

		searchInput = getURLInput();

		// Check the input is empty now.
		expect( searchInput.value ).toBe( '' );

		const searchResultLabel = container.querySelector(
			'.block-editor-link-control__search-results-label'
		);

		expect( searchResultLabel.innerHTML ).toBe( 'Recently updated' );

		expect( searchResultElements ).toHaveLength( 3 );
	} );

	it( 'should not display initial suggestions when there are no recently updated pages/posts', async () => {
		const noResults = [];
		// Force API returning empty results for recently updated Pages.
		mockFetchSearchSuggestions.mockImplementation( () =>
			Promise.resolve( noResults )
		);

		act( () => {
			render( <LinkControl showInitialSuggestions />, container );
		} );

		await eventLoopTick();

		const searchInput = getURLInput();

		const searchResultElements = getSearchResults();

		const searchResultLabel = container.querySelector(
			'.block-editor-link-control__search-results-label'
		);

		expect( searchResultLabel ).toBeFalsy();

		expect( searchResultElements ).toHaveLength( 0 );

		expect( searchInput.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
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

			act( () => {
				render( <LinkControlConsumer />, container );
			} );

			// Search Input UI.
			const searchInput = container.querySelector(
				'input[aria-label="URL"]'
			);

			// Simulate searching for a term.
			act( () => {
				Simulate.change( searchInput, {
					target: { value: entityNameText },
				} );
			} );

			await eventLoopTick();

			// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
			const searchResultElements = container.querySelectorAll(
				'[role="listbox"] [role="option"]'
			);

			const createButton = first(
				Array.from( searchResultElements ).filter( ( result ) =>
					result.innerHTML.includes( 'Create:' )
				)
			);

			expect( createButton ).not.toBeNull();
			expect( createButton.innerHTML ).toEqual(
				expect.stringContaining( entityNameText )
			);

			// No need to wait in this test because we control the Promise
			// resolution manually via the `resolver` reference.
			act( () => {
				Simulate.click( createButton );
			} );

			await eventLoopTick();

			// Check for loading indicator.
			const loadingIndicator = container.querySelector(
				'.block-editor-link-control__loading'
			);
			const currentLinkLabel = container.querySelector(
				'[aria-label="Currently selected"]'
			);

			expect( currentLinkLabel ).toBeNull();
			expect( loadingIndicator.innerHTML ).toEqual(
				expect.stringContaining( 'Creating' )
			);

			// Resolve the `createSuggestion` promise.
			await act( async () => {
				resolver( resolvedEntity );
			} );

			await eventLoopTick();

			const currentLink = container.querySelector(
				'[aria-label="Currently selected"]'
			);

			const currentLinkHTML = currentLink.innerHTML;

			expect( currentLinkHTML ).toEqual(
				expect.stringContaining( entityNameText )
			);
			expect( currentLinkHTML ).toEqual(
				expect.stringContaining( '/?p=123' )
			);
		}
	);

	it( 'should allow createSuggestion prop to return a non-Promise value', async () => {
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

		act( () => {
			render( <LinkControlConsumer />, container );
		} );

		// Search Input UI.
		const searchInput = container.querySelector(
			'input[aria-label="URL"]'
		);

		// Simulate searching for a term.
		act( () => {
			Simulate.change( searchInput, {
				target: { value: 'Some new page to create' },
			} );
		} );

		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
		const searchResultElements = container.querySelectorAll(
			'[role="listbox"] [role="option"]'
		);

		const createButton = first(
			Array.from( searchResultElements ).filter( ( result ) =>
				result.innerHTML.includes( 'Create:' )
			)
		);

		await act( async () => {
			Simulate.click( createButton );
		} );

		await eventLoopTick();

		const currentLink = container.querySelector(
			'[aria-label="Currently selected"]'
		);

		const currentLinkHTML = currentLink.innerHTML;

		expect( currentLinkHTML ).toEqual(
			expect.stringContaining( 'Some new page to create' )
		);
		expect( currentLinkHTML ).toEqual(
			expect.stringContaining( '/?p=123' )
		);
	} );

	it( 'should allow creation of entities via the keyboard', async () => {
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

		act( () => {
			render( <LinkControlConsumer />, container );
		} );

		// Search Input UI.
		const searchInput = container.querySelector(
			'input[aria-label="URL"]'
		);

		// Simulate searching for a term.
		act( () => {
			Simulate.change( searchInput, {
				target: { value: entityNameText },
			} );
		} );

		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
		const searchResultElements = container.querySelectorAll(
			'[role="listbox"] [role="option"]'
		);
		const createButton = first(
			Array.from( searchResultElements ).filter( ( result ) =>
				result.innerHTML.includes( 'Create:' )
			)
		);

		// Step down into the search results, highlighting the first result item.
		act( () => {
			Simulate.keyDown( searchInput, { keyCode: DOWN } );
		} );

		act( () => {
			Simulate.keyDown( createButton, { keyCode: ENTER } );
		} );

		await act( async () => {
			Simulate.keyDown( searchInput, { keyCode: ENTER } );
		} );

		await eventLoopTick();

		const currentLink = container.querySelector(
			'[aria-label="Currently selected"]'
		);

		const currentLinkHTML = currentLink.innerHTML;

		expect( currentLinkHTML ).toEqual(
			expect.stringContaining( entityNameText )
		);
	} );

	it( 'should allow customisation of button text', async () => {
		const entityNameText = 'A new page to be created';

		const LinkControlConsumer = () => {
			return (
				<LinkControl
					createSuggestion={ () => {} }
					createSuggestionButtonText="Custom suggestion text"
				/>
			);
		};

		act( () => {
			render( <LinkControlConsumer />, container );
		} );

		// Search Input UI.
		const searchInput = container.querySelector(
			'input[aria-label="URL"]'
		);

		// Simulate searching for a term.
		act( () => {
			Simulate.change( searchInput, {
				target: { value: entityNameText },
			} );
		} );

		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
		const searchResultElements = container.querySelectorAll(
			'[role="listbox"] [role="option"]'
		);

		const createButton = first(
			Array.from( searchResultElements ).filter( ( result ) =>
				result.innerHTML.includes( 'Custom suggestion text' )
			)
		);

		expect( createButton ).not.toBeNull();
	} );

	describe( 'Do not show create option', () => {
		it.each( [ [ undefined ], [ null ], [ false ] ] )(
			'should not show not show an option to create an entity when "createSuggestion" handler is %s',
			async ( handler ) => {
				act( () => {
					render(
						<LinkControl createSuggestion={ handler } />,
						container
					);
				} );
				// Await the initial suggestions to be fetched.
				await eventLoopTick();

				// Search Input UI.
				const searchInput = container.querySelector(
					'input[aria-label="URL"]'
				);

				// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
				const searchResultElements = container.querySelectorAll(
					'[role="listbox"] [role="option"]'
				);
				const createButton = first(
					Array.from( searchResultElements ).filter( ( result ) =>
						result.innerHTML.includes( 'Create:' )
					)
				);

				// Verify input has no value.
				expect( searchInput.value ).toBe( '' );
				expect( createButton ).toBeFalsy(); // Shouldn't exist!
			}
		);

		it( 'should not show not show an option to create an entity when input is empty', async () => {
			act( () => {
				render(
					<LinkControl
						showInitialSuggestions={ true } // Should show even if we're not showing initial suggestions.
						createSuggestion={ jest.fn() }
					/>,
					container
				);
			} );
			// Await the initial suggestions to be fetched.
			await eventLoopTick();

			// Search Input UI.
			const searchInput = container.querySelector(
				'input[aria-label="URL"]'
			);

			// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
			const searchResultElements = container.querySelectorAll(
				'[role="listbox"] [role="option"]'
			);
			const createButton = first(
				Array.from( searchResultElements ).filter( ( result ) =>
					result.innerHTML.includes( 'New page' )
				)
			);

			// Verify input has no value.
			expect( searchInput.value ).toBe( '' );
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
				act( () => {
					render(
						<LinkControl createSuggestion={ jest.fn() } />,
						container
					);
				} );

				// Search Input UI.
				const searchInput = container.querySelector(
					'input[aria-label="URL"]'
				);

				// Simulate searching for a term.
				act( () => {
					Simulate.change( searchInput, {
						target: { value: inputText },
					} );
				} );

				await eventLoopTick();

				// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
				const searchResultElements = container.querySelectorAll(
					'[role="listbox"] [role="option"]'
				);

				const createButton = first(
					Array.from( searchResultElements ).filter( ( result ) =>
						result.innerHTML.includes( 'New page' )
					)
				);

				expect( createButton ).toBeFalsy(); // Shouldn't exist!
			}
		);
	} );

	describe( 'Error handling', () => {
		it( 'should display human-friendly, perceivable error notice and re-show create button and search input if page creation request fails', async () => {
			const searchText = 'This page to be created';
			let searchInput;

			const throwsError = () => {
				throw new Error( 'API response returned invalid entity.' ); // This can be any error and msg.
			};

			const createSuggestion = () => Promise.reject( throwsError() );

			act( () => {
				render(
					<LinkControl createSuggestion={ createSuggestion } />,
					container
				);
			} );

			// Search Input UI.
			searchInput = container.querySelector( 'input[aria-label="URL"]' );

			// Simulate searching for a term.
			act( () => {
				Simulate.change( searchInput, {
					target: { value: searchText },
				} );
			} );

			await eventLoopTick();

			// TODO: select these by aria relationship to autocomplete rather than arbitrary selector.
			let searchResultElements = container.querySelectorAll(
				'[role="listbox"] [role="option"]'
			);
			let createButton = first(
				Array.from( searchResultElements ).filter( ( result ) =>
					result.innerHTML.includes( 'Create:' )
				)
			);

			await act( async () => {
				Simulate.click( createButton );
			} );

			await eventLoopTick();

			searchInput = container.querySelector( 'input[aria-label="URL"]' );

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
			expect( errorNotice ).not.toBeFalsy();
			expect( errorNotice.innerHTML ).toEqual(
				expect.stringContaining(
					'API response returned invalid entity'
				)
			);

			// Verify input is repopulated with original search text.
			expect( searchInput ).not.toBeFalsy();
			expect( searchInput.value ).toBe( searchText );

			// Verify search results are re-shown and create button is available.
			searchResultElements = container.querySelectorAll(
				'[role="listbox"] [role="option"]'
			);
			createButton = first(
				Array.from( searchResultElements ).filter( ( result ) =>
					result.innerHTML.includes( 'New page' )
				)
			);
		} );
	} );
} );

describe( 'Selecting links', () => {
	it( 'should display a selected link corresponding to the provided "currentLink" prop', () => {
		const selectedLink = first( fauxEntitySuggestions );

		const LinkControlConsumer = () => {
			const [ link ] = useState( selectedLink );

			return <LinkControl value={ link } />;
		};

		act( () => {
			render( <LinkControlConsumer />, container );
		} );

		// TODO: select by aria role or visible text.
		const currentLink = getCurrentLink();
		const currentLinkHTML = currentLink.innerHTML;
		const currentLinkAnchor = currentLink.querySelector(
			`[href="${ selectedLink.url }"]`
		);

		expect( currentLinkHTML ).toEqual(
			expect.stringContaining( selectedLink.title )
		);
		expect(
			queryByRole( currentLink, 'button', { name: 'Edit' } )
		).toBeTruthy();
		expect( currentLinkAnchor ).not.toBeNull();
	} );

	it( 'should hide "selected" link UI and display search UI prepopulated with previously selected link title when "Change" button is clicked', () => {
		const selectedLink = first( fauxEntitySuggestions );

		const LinkControlConsumer = () => {
			const [ link, setLink ] = useState( selectedLink );

			return (
				<LinkControl
					value={ link }
					onChange={ ( suggestion ) => setLink( suggestion ) }
				/>
			);
		};

		act( () => {
			render( <LinkControlConsumer />, container );
		} );

		// Required in order to select the button below.
		let currentLinkUI = getCurrentLink();
		const currentLinkBtn = currentLinkUI.querySelector( 'button' );

		// Simulate searching for a term.
		act( () => {
			Simulate.click( currentLinkBtn );
		} );

		const searchInput = getURLInput();
		currentLinkUI = getCurrentLink();

		// We should be back to showing the search input.
		expect( searchInput ).not.toBeNull();
		expect( searchInput.value ).toBe( selectedLink.url ); // Prepopulated with previous link's URL.
		expect( currentLinkUI ).toBeNull();
	} );

	describe( 'Selection using mouse click', () => {
		it.each( [
			[ 'entity', 'hello world', first( fauxEntitySuggestions ) ], // Entity search.
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
				const LinkControlConsumer = () => {
					const [ link, setLink ] = useState();

					return (
						<LinkControl
							value={ link }
							onChange={ ( suggestion ) => setLink( suggestion ) }
						/>
					);
				};

				act( () => {
					render( <LinkControlConsumer />, container );
				} );

				// Search Input UI.
				const searchInput = getURLInput();

				// Simulate searching for a term.
				act( () => {
					Simulate.change( searchInput, {
						target: { value: searchTerm },
					} );
				} );

				// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
				await eventLoopTick();

				const searchResultElements = getSearchResults();

				const firstSearchSuggestion = first( searchResultElements );

				// Simulate selecting the first of the search suggestions.
				act( () => {
					Simulate.click( firstSearchSuggestion );
				} );

				const currentLink = container.querySelector(
					'.block-editor-link-control__search-item.is-current'
				);
				const currentLinkHTML = currentLink.innerHTML;
				const currentLinkAnchor = currentLink.querySelector(
					`[href="${ selectedLink.url }"]`
				);

				// Check that this suggestion is now shown as selected.
				expect( currentLinkHTML ).toEqual(
					expect.stringContaining( selectedLink.title )
				);
				expect( currentLinkHTML ).toEqual(
					expect.stringContaining( 'Edit' )
				);
				expect( currentLinkAnchor ).not.toBeNull();
			}
		);
	} );

	describe( 'Selection using keyboard', () => {
		it.each( [
			[ 'entity', 'hello world', first( fauxEntitySuggestions ) ], // Entity search.
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
				const LinkControlConsumer = () => {
					const [ link, setLink ] = useState();

					return (
						<LinkControl
							value={ link }
							onChange={ ( suggestion ) => setLink( suggestion ) }
						/>
					);
				};

				act( () => {
					render( <LinkControlConsumer />, container );
				} );

				// Search Input UI.
				const searchInput = getURLInput();
				searchInput.focus();

				// Simulate searching for a term.
				act( () => {
					Simulate.change( searchInput, {
						target: { value: searchTerm },
					} );
				} );

				// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
				await eventLoopTick();

				// Step down into the search results, highlighting the first result item.
				act( () => {
					Simulate.keyDown( searchInput, { keyCode: DOWN } );
				} );

				const searchResultElements = getSearchResults();

				const firstSearchSuggestion = first( searchResultElements );
				const secondSearchSuggestion = nth( searchResultElements, 1 );

				let selectedSearchResultElement = container.querySelector(
					'[role="option"][aria-selected="true"]'
				);

				// We should have highlighted the first item using the keyboard.
				expect( selectedSearchResultElement ).toEqual(
					firstSearchSuggestion
				);

				// Only entity searches contain more than 1 suggestion.
				if ( type === 'entity' ) {
					// Check we can go down again using the down arrow.
					act( () => {
						Simulate.keyDown( searchInput, { keyCode: DOWN } );
					} );

					selectedSearchResultElement = container.querySelector(
						'[role="option"][aria-selected="true"]'
					);

					// We should have highlighted the first item using the keyboard
					// eslint-disable-next-line jest/no-conditional-expect.
					expect( selectedSearchResultElement ).toEqual(
						secondSearchSuggestion
					);

					// Check we can go back up via up arrow.
					act( () => {
						Simulate.keyDown( searchInput, { keyCode: UP } );
					} );

					selectedSearchResultElement = container.querySelector(
						'[role="option"][aria-selected="true"]'
					);

					// We should be back to highlighting the first search result again
					// eslint-disable-next-line jest/no-conditional-expect.
					expect( selectedSearchResultElement ).toEqual(
						firstSearchSuggestion
					);
				}

				// Submit the selected item as the current link.
				act( () => {
					Simulate.keyDown( searchInput, { keyCode: ENTER } );
				} );

				// Check that the suggestion selected via is now shown as selected.
				const currentLink = container.querySelector(
					'.block-editor-link-control__search-item.is-current'
				);
				const currentLinkHTML = currentLink.innerHTML;
				const currentLinkAnchor = currentLink.querySelector(
					`[href="${ selectedLink.url }"]`
				);

				// Make sure focus is retained after submission.
				expect( container.contains( document.activeElement ) ).toBe(
					true
				);

				expect( currentLinkHTML ).toEqual(
					expect.stringContaining( selectedLink.title )
				);
				expect( currentLinkHTML ).toEqual(
					expect.stringContaining( 'Edit' )
				);
				expect( currentLinkAnchor ).not.toBeNull();
			}
		);

		it( 'should allow selection of initial search results via the keyboard', async () => {
			act( () => {
				render( <LinkControl showInitialSuggestions />, container );
			} );

			await eventLoopTick();

			const searchResultsWrapper = container.querySelector(
				'[role="listbox"]'
			);

			const searchResultsLabel = container.querySelector(
				`#${ searchResultsWrapper.getAttribute( 'aria-labelledby' ) }`
			);

			expect( searchResultsLabel.innerHTML ).toEqual(
				'Recently updated'
			);

			// Search Input UI.
			const searchInput = getURLInput();

			// Step down into the search results, highlighting the first result item.
			act( () => {
				Simulate.keyDown( searchInput, { keyCode: DOWN } );
			} );

			await eventLoopTick();

			const searchResultElements = getSearchResults();

			const firstSearchSuggestion = first( searchResultElements );
			const secondSearchSuggestion = nth( searchResultElements, 1 );

			let selectedSearchResultElement = container.querySelector(
				'[role="option"][aria-selected="true"]'
			);

			// We should have highlighted the first item using the keyboard.
			expect( selectedSearchResultElement ).toEqual(
				firstSearchSuggestion
			);

			// Check we can go down again using the down arrow.
			act( () => {
				Simulate.keyDown( searchInput, { keyCode: DOWN } );
			} );

			selectedSearchResultElement = container.querySelector(
				'[role="option"][aria-selected="true"]'
			);

			// We should have highlighted the first item using the keyboard.
			expect( selectedSearchResultElement ).toEqual(
				secondSearchSuggestion
			);

			// Check we can go back up via up arrow.
			act( () => {
				Simulate.keyDown( searchInput, { keyCode: UP } );
			} );

			selectedSearchResultElement = container.querySelector(
				'[role="option"][aria-selected="true"]'
			);

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
		const selectedLink = first( fauxEntitySuggestions );
		const expectedSettingText = 'Open in new tab';

		const LinkControlConsumer = () => {
			const [ link ] = useState( selectedLink );

			return <LinkControl value={ link } />;
		};

		act( () => {
			render( <LinkControlConsumer />, container );
		} );

		const newTabSettingLabel = Array.from(
			container.querySelectorAll( 'label' )
		).find(
			( label ) =>
				label.innerHTML &&
				label.innerHTML.includes( expectedSettingText )
		);

		expect( newTabSettingLabel ).not.toBeUndefined(); // find() returns "undefined" if not found.

		const newTabSettingLabelForAttr = newTabSettingLabel.getAttribute(
			'for'
		);
		const newTabSettingInput = container.querySelector(
			`#${ newTabSettingLabelForAttr }`
		);
		expect( newTabSettingInput ).not.toBeNull();
		expect( newTabSettingInput.checked ).toBe( false );
	} );

	it( 'should display a setting control with correct default state for each of the custom settings provided', async () => {
		const selectedLink = first( fauxEntitySuggestions );

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

		const customSettingsLabelsText = customSettings.map(
			( setting ) => setting.title
		);

		const LinkControlConsumer = () => {
			const [ link ] = useState( selectedLink );

			return (
				<LinkControl
					value={ { ...link, newTab: false, noFollow: true } }
					settings={ customSettings }
				/>
			);
		};

		act( () => {
			render( <LinkControlConsumer />, container );
		} );

		// Grab the elements using user perceivable DOM queries.
		const settingsLegend = Array.from(
			container.querySelectorAll( 'legend' )
		).find(
			( legend ) =>
				legend.innerHTML &&
				legend.innerHTML.includes( 'Currently selected link settings' )
		);
		const settingsFieldset = settingsLegend.closest( 'fieldset' );
		const settingControlsLabels = Array.from(
			settingsFieldset.querySelectorAll( 'label' )
		);
		const settingControlsInputs = settingControlsLabels.map( ( label ) => {
			return settingsFieldset.querySelector(
				`#${ label.getAttribute( 'for' ) }`
			);
		} );

		const settingControlLabelsText = Array.from(
			settingControlsLabels
		).map( ( label ) => label.innerHTML );

		// Check we have the correct number of controls.
		expect( settingControlsLabels ).toHaveLength( 2 );

		// Check the labels match.
		expect( settingControlLabelsText ).toEqual(
			expect.arrayContaining( customSettingsLabelsText )
		);

		// Assert the default "checked" states match the expected.
		expect( settingControlsInputs[ 0 ].checked ).toEqual( false );
		expect( settingControlsInputs[ 1 ].checked ).toEqual( true );
	} );
} );

describe( 'Post types', () => {
	it( 'should display post type in search results of link', async () => {
		const searchTerm = 'Hello world';

		act( () => {
			render( <LinkControl />, container );
		} );

		// Search Input UI.
		const searchInput = getURLInput();

		// Simulate searching for a term.
		act( () => {
			Simulate.change( searchInput, { target: { value: searchTerm } } );
		} );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
		await eventLoopTick();

		const searchResultElements = getSearchResults();

		searchResultElements.forEach( ( resultItem, index ) => {
			expect(
				queryByText( resultItem, fauxEntitySuggestions[ index ].type )
			).toBeTruthy();
		} );
	} );

	it.each( [ 'page', 'post', 'tag', 'post_tag', 'category' ] )(
		'should NOT display post type in search results of %s',
		async ( postType ) => {
			const searchTerm = 'Hello world';

			act( () => {
				render(
					<LinkControl suggestionsQuery={ { type: postType } } />,
					container
				);
			} );

			// Search Input UI.
			const searchInput = getURLInput();

			// Simulate searching for a term.
			act( () => {
				Simulate.change( searchInput, {
					target: { value: searchTerm },
				} );
			} );

			// fetchFauxEntitySuggestions resolves on next "tick" of event loop.
			await eventLoopTick();

			const searchResultElements = getSearchResults();

			searchResultElements.forEach( ( resultItem, index ) => {
				expect(
					queryByText(
						resultItem,
						fauxEntitySuggestions[ index ].type
					)
				).toBeFalsy();
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
				title:
					'Blog Tool, Publishing Platform, and CMS \u2014 WordPress.org',
				icon: 'https://s.w.org/favicon.ico?2',
				description:
					'Open source software which you can use to easily create a beautiful website, blog, or app.',
				image: 'https://s.w.org/images/home/screen-themes.png?3',
			} )
		);

		act( () => {
			render( <LinkControl value={ selectedLink } />, container );
		} );

		// mockFetchRichUrlData resolves on next "tick" of event loop.
		await act( async () => {
			await eventLoopTick();
		} );

		const linkPreview = container.querySelector(
			"[aria-label='Currently selected']"
		);

		const isRichLinkPreview = linkPreview.classList.contains( 'is-rich' );

		expect( mockFetchRichUrlData ).not.toHaveBeenCalled();
		expect( isRichLinkPreview ).toBe( false );
	} );

	it( 'should display a rich preview when data is available', async () => {
		mockFetchRichUrlData.mockImplementation( () =>
			Promise.resolve( {
				title:
					'Blog Tool, Publishing Platform, and CMS \u2014 WordPress.org',
				icon: 'https://s.w.org/favicon.ico?2',
				description:
					'Open source software which you can use to easily create a beautiful website, blog, or app.',
				image: 'https://s.w.org/images/home/screen-themes.png?3',
			} )
		);

		act( () => {
			render(
				<LinkControl value={ selectedLink } hasRichPreviews />,
				container
			);
		} );

		// mockFetchRichUrlData resolves on next "tick" of event loop.
		await act( async () => {
			await eventLoopTick();
		} );

		const linkPreview = container.querySelector(
			"[aria-label='Currently selected']"
		);

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

		act( () => {
			render(
				<LinkControl value={ selectedLink } hasRichPreviews />,
				container
			);
		} );

		// mockFetchRichUrlData resolves on next "tick" of event loop.
		await act( async () => {
			await eventLoopTick();
		} );

		const linkPreview = container.querySelector(
			"[aria-label='Currently selected']"
		);

		// Todo: refactor to use user-facing queries.
		const hasRichImagePreview = linkPreview.querySelector(
			'.block-editor-link-control__search-item-image'
		);

		// Todo: refactor to use user-facing queries.
		const hasRichDescriptionPreview = linkPreview.querySelector(
			'.block-editor-link-control__search-item-description'
		);

		expect( hasRichImagePreview ).toBeFalsy();
		expect( hasRichDescriptionPreview ).toBeFalsy();
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

		act( () => {
			render(
				<LinkControl value={ selectedLink } hasRichPreviews />,
				container
			);
		} );

		// mockFetchRichUrlData resolves on next "tick" of event loop.
		await act( async () => {
			await eventLoopTick();
		} );

		const linkPreview = container.querySelector(
			"[aria-label='Currently selected']"
		);

		const isRichLinkPreview = linkPreview.classList.contains( 'is-rich' );
		expect( isRichLinkPreview ).toBe( true );

		const titlePreview = linkPreview.querySelector(
			'.block-editor-link-control__search-item-title'
		);

		expect( titlePreview.textContent ).toEqual(
			expect.stringContaining( selectedLink.title )
		);
	} );

	it( 'should display a fallback when icon is missing from rich data', async () => {
		mockFetchRichUrlData.mockImplementation( () =>
			Promise.resolve( {
				title:
					'Blog Tool, Publishing Platform, and CMS \u2014 WordPress.org',
				description:
					'Open source software which you can use to easily create a beautiful website, blog, or app.',
				image: 'https://s.w.org/images/home/screen-themes.png?3',
			} )
		);

		act( () => {
			render(
				<LinkControl value={ selectedLink } hasRichPreviews />,
				container
			);
		} );

		// mockFetchRichUrlData resolves on next "tick" of event loop.
		await act( async () => {
			await eventLoopTick();
		} );

		const linkPreview = container.querySelector(
			"[aria-label='Currently selected']"
		);

		const isRichLinkPreview = linkPreview.classList.contains( 'is-rich' );
		expect( isRichLinkPreview ).toBe( true );

		const iconPreview = linkPreview.querySelector(
			`.block-editor-link-control__search-item-icon`
		);

		const fallBackIcon = iconPreview.querySelector( 'svg' );
		const richIcon = iconPreview.querySelector( 'img' );

		expect( fallBackIcon ).toBeTruthy();
		expect( richIcon ).toBeFalsy();
	} );

	it.each( [ 'image', 'description' ] )(
		'should not display the rich %s when it is missing from the data',
		async ( dataItem ) => {
			mockFetchRichUrlData.mockImplementation( () => {
				const data = {
					title:
						'Blog Tool, Publishing Platform, and CMS \u2014 WordPress.org',
					icon: 'https://s.w.org/favicon.ico?2',
					description:
						'Open source software which you can use to easily create a beautiful website, blog, or app.',
					image: 'https://s.w.org/images/home/screen-themes.png?3',
				};
				delete data[ dataItem ];
				return Promise.resolve( data );
			} );

			act( () => {
				render(
					<LinkControl value={ selectedLink } hasRichPreviews />,
					container
				);
			} );

			// mockFetchRichUrlData resolves on next "tick" of event loop.
			await act( async () => {
				await eventLoopTick();
			} );

			const linkPreview = container.querySelector(
				"[aria-label='Currently selected']"
			);

			const isRichLinkPreview = linkPreview.classList.contains(
				'is-rich'
			);
			expect( isRichLinkPreview ).toBe( true );

			const missingDataItem = linkPreview.querySelector(
				`.block-editor-link-control__search-item-${ dataItem }`
			);

			expect( missingDataItem ).toBeFalsy();
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

			act( () => {
				render(
					<LinkControl value={ selectedLink } hasRichPreviews />,
					container
				);
			} );

			// mockFetchRichUrlData resolves on next "tick" of event loop.
			await act( async () => {
				await eventLoopTick();
			} );

			const linkPreview = container.querySelector(
				"[aria-label='Currently selected']"
			);

			const isRichLinkPreview = linkPreview.classList.contains(
				'is-rich'
			);

			expect( isRichLinkPreview ).toBe( false );
		}
	);

	it( 'should display in loading state when rich data is being fetched', async () => {
		const nonResolvingPromise = () => new Promise( () => {} );

		mockFetchRichUrlData.mockImplementation( nonResolvingPromise );

		act( () => {
			render(
				<LinkControl value={ selectedLink } hasRichPreviews />,
				container
			);
		} );

		// mockFetchRichUrlData resolves on next "tick" of event loop.
		await act( async () => {
			await eventLoopTick();
		} );

		const linkPreview = container.querySelector(
			"[aria-label='Currently selected']"
		);

		const isFetchingRichPreview = linkPreview.classList.contains(
			'is-fetching'
		);
		const isRichLinkPreview = linkPreview.classList.contains( 'is-rich' );

		expect( isFetchingRichPreview ).toBe( true );
		expect( isRichLinkPreview ).toBe( false );
	} );

	it( 'should remove fetching UI indicators and fallback to standard preview if request for rich preview results in an error', async () => {
		const simulateFailedFetch = () => Promise.reject();

		mockFetchRichUrlData.mockImplementation( simulateFailedFetch );

		act( () => {
			render(
				<LinkControl value={ selectedLink } hasRichPreviews />,
				container
			);
		} );

		// mockFetchRichUrlData resolves on next "tick" of event loop.
		await act( async () => {
			await eventLoopTick();
		} );

		const linkPreview = container.querySelector(
			"[aria-label='Currently selected']"
		);

		const isFetchingRichPreview = linkPreview.classList.contains(
			'is-fetching'
		);

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
	const selectedLink = first( fauxEntitySuggestions );

	it( 'should not show a means to alter the link title text by default', async () => {
		act( () => {
			render(
				<LinkControl value={ selectedLink } forceIsEditingLink />,
				container
			);
		} );

		expect(
			queryByRole( container, 'textbox', { name: 'Text' } )
		).toBeFalsy();
	} );

	it.each( [ null, undefined, '   ' ] )(
		'should not show the link title text input when the URL is `%s`',
		async ( urlValue ) => {
			const selectedLinkWithoutURL = {
				...first( fauxEntitySuggestions ),
				url: urlValue,
			};

			act( () => {
				render(
					<LinkControl
						value={ selectedLinkWithoutURL }
						forceIsEditingLink
						hasTextControl
					/>,
					container
				);
			} );

			expect(
				queryByRole( container, 'textbox', { name: 'Text' } )
			).toBeFalsy();
		}
	);

	it( 'should show a text input to alter the link title text when hasTextControl prop is truthy', async () => {
		act( () => {
			render(
				<LinkControl
					value={ selectedLink }
					forceIsEditingLink
					hasTextControl
				/>,
				container
			);
		} );

		expect(
			queryByRole( container, 'textbox', { name: 'Text' } )
		).toBeTruthy();
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
			act( () => {
				render(
					<LinkControl
						value={ linkWithTitle }
						forceIsEditingLink
						hasTextControl
					/>,
					container
				);
			} );

			const textInput = queryByRole( container, 'textbox', {
				name: 'Text',
			} );

			expect( textInput.value ).toEqual( titleValue );
		}
	);

	it( "should ensure title value matching the text input's current value is included in onChange handler value on submit", async () => {
		const mockOnChange = jest.fn();
		const textValue = 'My new text value';

		act( () => {
			render(
				<LinkControl
					value={ selectedLink }
					forceIsEditingLink
					hasTextControl
					onChange={ mockOnChange }
				/>,
				container
			);
		} );

		let textInput = queryByRole( container, 'textbox', { name: 'Text' } );

		act( () => {
			Simulate.change( textInput, {
				target: { value: textValue },
			} );
		} );

		textInput = queryByRole( container, 'textbox', { name: 'Text' } );

		expect( textInput.value ).toEqual( textValue );

		const submitButton = queryByRole( container, 'button', {
			name: 'Submit',
		} );

		act( () => {
			Simulate.click( submitButton );
		} );

		expect( mockOnChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				title: textValue,
			} )
		);
	} );

	it( 'should allow `ENTER` keypress within the text field to trigger submission of value', async () => {
		const textValue = 'My new text value';
		const mockOnChange = jest.fn();
		act( () => {
			render(
				<LinkControl
					value={ selectedLink }
					forceIsEditingLink
					hasTextControl
					onChange={ mockOnChange }
				/>,
				container
			);
		} );

		const textInput = queryByRole( container, 'textbox', { name: 'Text' } );

		expect( textInput ).toBeTruthy();

		act( () => {
			Simulate.change( textInput, {
				target: { value: textValue },
			} );
		} );

		// Attempt to submit the empty search value in the input.
		act( () => {
			Simulate.keyDown( textInput, { keyCode: ENTER } );
		} );

		expect( mockOnChange ).toHaveBeenCalledWith( {
			title: textValue,
			url: selectedLink.url,
		} );

		// The text input should not be showing as the form is submitted.
		expect(
			queryByRole( container, 'textbox', { name: 'Text' } )
		).toBeFalsy();
	} );
} );
