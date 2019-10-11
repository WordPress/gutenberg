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
	it( 'should render with required props', () => {
		act( () => {
			render(
				<LinkControl
				/>, container
			);
		} );

		// Search Input UI
		// const searchInputLabel = Array.from( container.querySelectorAll( 'label' ) ).find( ( label ) => label.innerText === 'Search or input url' );
		const searchInput = container.querySelector( 'input[aria-label="URL"]' );

		// expect( searchInputLabel ).not.toBeNull();
		expect( searchInput ).not.toBeNull();

		expect( container.innerHTML ).toMatchSnapshot();
	} );
} );

describe( 'Searching', () => {
	it( 'should render search suggestions when current input value is not URL-like', async ( ) => {
		const searchTerm = 'Hello';

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
		searchResultElements = container.querySelectorAll( '[role="listbox"] button[role="option"]' );

		expect( searchResultElements ).toHaveLength( fauxEntitySuggestions.length );

		// Reset the search term
		act( () => {
			Simulate.change( searchInput, { target: { value: '' } } );
		} );

		// fetchFauxEntitySuggestions resolves on next "tick" of event loop
		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitary selector.
		searchResultElements = container.querySelectorAll( '[role="listbox"] button[role="option"]' );

		expect( searchResultElements ).toHaveLength( 0 );
	} );

	it( 'should render a single suggestion result when the current input value is URL-like', async ( ) => {
		const searchTerm = 'http://make.wordpress.com';

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
		const searchResultElements = container.querySelectorAll( '[role="listbox"] button[role="option"]' );
		const searchResultHTML = searchResultElements[ 0 ].innerHTML;

		expect( searchResultElements ).toHaveLength( 1 );
		expect( searchResultHTML ).toEqual( expect.stringContaining( searchTerm ) );
	} );

	it( 'should reset input and search results when search term is cleared or reset', async ( ) => {
		const searchTerm = 'Hello';

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
		searchResultElements = container.querySelectorAll( '[role="listbox"] button[role="option"]' );

		// Check we have definitely rendered some suggestions
		expect( searchResultElements ).toHaveLength( fauxEntitySuggestions.length );

		// Grab the reset button now it's available
		const resetUI = container.querySelector( '[aria-label="Reset"]' );

		act( () => {
			Simulate.click( resetUI );
		} );

		await eventLoopTick();

		// TODO: select these by aria relationship to autocomplete rather than arbitary selector.
		searchResultElements = container.querySelectorAll( '[role="listbox"] button[role="option"]' );
		searchInput = container.querySelector( 'input[aria-label="URL"]' );

		expect( searchInput.value ).toBe( '' );
		expect( searchResultElements ).toHaveLength( 0 );
	} );
} );
