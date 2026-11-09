/**
 * A router region without its own `data-wp-interactive` navigates and restores
 * with the namespace of the page that supplies it, starting from an initial
 * page the router caches from the live, hydrated document.
 *
 * The markup of the initial page is in the document before the runtime loads,
 * so the runtime hydrates it and the router caches it as it does on a page
 * load. Vitest loads a fresh router for each test file, so this file holds the
 * tests that need that initial page.
 */
import { expect, test, vi } from 'vitest';
import { store } from '@wordpress/interactivity';
import { actions } from '../index';
import { nextFrames, pageHtml, quiet } from './fixtures/helpers';

// Fills the jsdom gaps and sets up the initial page before the runtime loads.
// The region has no `data-wp-interactive`; it inherits the one of its parent.
await vi.hoisted( async () => {
	await import( './fixtures/jsdom-setup' );
	window.history.replaceState( {}, '', '/inherited/a' );
	document.body.innerHTML = `<div data-wp-interactive="inherited/a"><div data-wp-router-region="inherited/region"><p class="who" data-wp-text="state.who">page a</p><div data-wp-context='{ "label": "context a" }'><p class="label" data-wp-text="context.label">context a</p></div><button data-wp-on--click="actions.bump">bump</button><p class="count" data-wp-text="state.count">0</p></div></div>`;
} );

// Each page has a namespace of its own, so the same unprefixed directives
// resolve to different state and actions on each of them.
for ( const page of [ 'a', 'b' ] ) {
	const { state } = store( `inherited/${ page }`, {
		state: { who: `page ${ page }`, count: 0 },
		actions: {
			/** Counts how often the page's button was pressed. */
			bump() {
				state.count++;
			},
		},
	} );
}

// The region of the current page, which stays the same element throughout.
const region = () =>
	document.querySelector( '[data-wp-router-region]' ) as Element;

/**
 * Reads what the region shows.
 *
 * @return The text of the region's directives.
 */
const shown = () => ( {
	who: region().querySelector( '.who' )!.textContent,
	label: region().querySelector( '.label' )!.textContent,
	count: region().querySelector( '.count' )!.textContent,
} );

/** Presses the region's button, as the user does on the live page. */
const press = async () => {
	( region().querySelector( 'button' ) as HTMLButtonElement ).click();
	await nextFrames();
};

/**
 * Moves through the history and waits for the router to restore the page.
 *
 * @param direction History traversal direction.
 */
const traverse = async ( direction: 'back' | 'forward' ) => {
	const popped = new Promise< void >( ( resolve ) =>
		window.addEventListener( 'popstate', () => resolve(), { once: true } )
	);
	window.history[ direction ]();
	await popped;
	await nextFrames();
};

test( 'shows each page with its own enclosing namespace on navigation and history traversal', async () => {
	await nextFrames();
	expect( shown() ).toEqual( {
		who: 'page a',
		label: 'context a',
		count: '0',
	} );

	await actions.navigate( 'http://localhost/inherited/b', {
		...quiet,
		html: pageHtml(
			`<div data-wp-interactive="inherited/b"><div data-wp-router-region="inherited/region"><p class="who" data-wp-text="state.who">page b</p><div data-wp-context='{ "label": "context b" }'><p class="label" data-wp-text="context.label">context b</p></div><button data-wp-on--click="actions.bump">bump</button><p class="count" data-wp-text="state.count">0</p></div></div>`
		),
	} );
	await nextFrames();
	expect( shown() ).toEqual( {
		who: 'page b',
		label: 'context b',
		count: '0',
	} );
	await press();
	expect( shown().count ).toBe( '1' );

	// The initial page comes from the live document the router cached.
	await traverse( 'back' );
	expect( shown() ).toEqual( {
		who: 'page a',
		label: 'context a',
		count: '0',
	} );
	await press();
	await press();
	expect( shown().count ).toBe( '2' );

	await traverse( 'forward' );
	expect( shown() ).toEqual( {
		who: 'page b',
		label: 'context b',
		count: '1',
	} );
	await press();
	expect( shown().count ).toBe( '2' );
} );
