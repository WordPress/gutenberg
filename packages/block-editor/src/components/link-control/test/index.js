/**
 * External dependencies
 */
import { render, unmountComponentAtNode } from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';

/**
 * Internal dependencies
 */
import LinkControl from '../index';
import { fauxEntitySuggestions, fetchFauxEntitySuggestions } from './fixtures';

function eventLoopTick() {
	return new Promise( ( resolve ) => setImmediate( resolve ) );
}

let container = null;
beforeEach( () => {
	// setup a DOM element as a render target
	container = document.createElement( 'div' );
	document.body.appendChild( container );
} );

afterEach( () => {
	// cleanup on exiting
	unmountComponentAtNode( container );
	container.remove();
	container = null;
} );

describe( 'Basic rendering', () => {
	it( 'should display with required props', () => {
		act( () => {
			render(
				<LinkControl
				/>, container
			);
		} );

		// Search Input UI
		const searchInput = container.querySelector( 'input[aria-label="URL"]' );

		// expect( searchInputLabel ).not.toBeNull();
		expect( searchInput ).not.toBeNull();

		expect( container.innerHTML ).toMatchSnapshot();
	} );
} );

describe( 'Searching for a link', () => {
	it( 'should display loading UI when input is valid but search results have yet to be returned', async () => {
		const searchTerm = 'Hello';

		let resolver;

		const fauxRequest = () => new Promise( ( resolve ) => {
			resolver = resolve;
		} );

		act( () => {
			render(
				<LinkControl
					fetchSearchSuggestions={ fauxRequest }
				/>, container
			);
		} );

		// Search Input UI
		const searchInput = container.querySelector( 'input[aria-label="URL"]' );

		// Simulate searching for a term
		act( () => {
			Simulate.change( searchInput, { target: { value: searchTerm } } );
		} );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop
		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitary selector.
		const searchResultElements = container.querySelectorAll( '[role="menu"] button[role="menuitem"]' );

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

	it( 'should display search suggestions when current input value is not URL-like', async ( ) => {
		const searchTerm = 'Hello world';

		act( () => {
			render(
				<LinkControl
					fetchSearchSuggestions={ fetchFauxEntitySuggestions }
				/>, container
			);
		} );

		let searchResultElements;

		// Search Input UI
		const searchInput = container.querySelector( 'input[aria-label="URL"]' );

		// TODO: select these by aria relationship to autocomplete rather than arbitary selector.
		searchResultElements = container.querySelectorAll( '[role="menu"] button[role="menuitem"]' );

		expect( searchResultElements ).toHaveLength( 0 );

		// Simulate searching for a term
		act( () => {
			Simulate.change( searchInput, { target: { value: searchTerm } } );
		} );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop
		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitary selector.
		searchResultElements = container.querySelectorAll( '[role="listbox"] [role="option"]' );

		expect( searchResultElements ).toHaveLength( fauxEntitySuggestions.length );

		// Reset the search term
		act( () => {
			Simulate.change( searchInput, { target: { value: '' } } );
		} );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop
		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitary selector.
		searchResultElements = container.querySelectorAll( '[role="listbox"] [role="option"]' );

		expect( searchResultElements ).toHaveLength( 0 );
	} );

	it( 'should reset input and search results when search term is cleared or reset', async ( ) => {
		const searchTerm = 'Hello world';

		act( () => {
			render(
				<LinkControl
					fetchSearchSuggestions={ fetchFauxEntitySuggestions }
				/>, container
			);
		} );

		let searchResultElements;
		let searchInput;

		// Search Input UI
		searchInput = container.querySelector( 'input[aria-label="URL"]' );

		// Simulate searching for a term
		act( () => {
			Simulate.change( searchInput, { target: { value: searchTerm } } );
		} );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop
		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitary selector.
		searchResultElements = container.querySelectorAll( '[role="listbox"] [role="option"]' );

		// Check we have definitely rendered some suggestions
		expect( searchResultElements ).toHaveLength( fauxEntitySuggestions.length );

		// Grab the reset button now it's available
		const resetUI = container.querySelector( '[aria-label="Reset"]' );

		act( () => {
			Simulate.click( resetUI );
		} );

		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitary selector.
		searchResultElements = container.querySelectorAll( '[role="listbox"] [role="option"]' );
		searchInput = container.querySelector( 'input[aria-label="URL"]' );

		expect( searchInput.value ).toBe( '' );
		expect( searchResultElements ).toHaveLength( 0 );
	} );
} );

describe( 'Manual link entry', () => {
	it.each( [
		[ 'https://make.wordpress.org' ], // explicit https
		[ 'http://make.wordpress.org' ], // explicit http
		[ 'www.wordpress.org' ], // usage of "www"
	] )( 'should display a single suggestion result when the current input value is URL-like (eg: %s)', async ( searchTerm ) => {
		act( () => {
			render(
				<LinkControl
					fetchSearchSuggestions={ fetchFauxEntitySuggestions }
				/>, container
			);
		} );

		// Search Input UI
		const searchInput = container.querySelector( 'input[aria-label="URL"]' );

		// Simulate searching for a term
		act( () => {
			Simulate.change( searchInput, { target: { value: searchTerm } } );
		} );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop
		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitary selector.
		const searchResultElements = container.querySelectorAll( '[role="listbox"] [role="option"]' );
		const firstSearchResultItemHTML = searchResultElements[ 0 ].innerHTML;
		const expectedResultsLength = 1;

		expect( searchResultElements ).toHaveLength( expectedResultsLength );
		expect( firstSearchResultItemHTML ).toEqual( expect.stringContaining( searchTerm ) );
		expect( firstSearchResultItemHTML ).toEqual( expect.stringContaining( 'Press ENTER to add this link' ) );
	} );

	it( 'should recognise "mailto" links and handle as manual entry', async () => {
		const searchTerm = 'mailto:example123456@wordpress.org';
		const searchType = 'mailto';

		act( () => {
			render(
				<LinkControl
					fetchSearchSuggestions={ fetchFauxEntitySuggestions }
				/>, container
			);
		} );

		// Search Input UI
		const searchInput = container.querySelector( 'input[aria-label="URL"]' );

		// Simulate searching for a term
		act( () => {
			Simulate.change( searchInput, { target: { value: searchTerm } } );
		} );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop
		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitary selector.
		const searchResultElements = container.querySelectorAll( '[role="listbox"] [role="option"]' );
		const firstSearchResultItemHTML = searchResultElements[ 0 ].innerHTML;
		const expectedResultsLength = 1;

		expect( searchResultElements ).toHaveLength( expectedResultsLength );
		expect( firstSearchResultItemHTML ).toEqual( expect.stringContaining( searchTerm ) );
		expect( firstSearchResultItemHTML ).toEqual( expect.stringContaining( searchType ) );
		expect( firstSearchResultItemHTML ).toEqual( expect.stringContaining( 'Press ENTER to add this link' ) );
	} );
} );
