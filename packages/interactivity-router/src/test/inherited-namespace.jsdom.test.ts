/**
 * Navigation updates, nests and attaches router regions that do not carry
 * `data-wp-interactive` and inherit the namespace of an interactive ancestor.
 * The router is imported once because it registers global listeners; each test
 * uses fresh stores and regions so its DOM and cached pages are independent.
 */
import { beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { asDangerousHTML, store } from '@wordpress/interactivity';
import { actions } from '../index';
import {
	hydrateHtml,
	nextFrames,
	pageHtml,
	quiet,
	traverseTo,
} from './fixtures/helpers';

// Fill jsdom's runtime gaps before the Interactivity API evaluates.
await vi.hoisted( async () => {
	await import( './fixtures/jsdom-setup' );
} );

// Distinguish singleton store registrations and cached destination URLs.
let testCount = 0;
// Namespace of the current test's live page.
let namespace: string;
// Destination URL unique to the current test.
let url: string;
// Number of times an island's initialization action actually ran.
let marks: number;
// Number of times the button of the nested namespace was pressed.
let presses: number;

/**
 * Builds a router region that inherits the namespace of its parent.
 *
 * @param content Region content.
 * @param region  Region id suffix, or an object with the id suffix and the
 *                optional `attachTo` selector.
 * @param attrs   Further attributes of the region element.
 * @return Region markup.
 */
const regionHtml = (
	content: string,
	region: string | { id: string; attachTo?: string } = 'r',
	attrs = ''
) =>
	`<div data-wp-router-region='${ JSON.stringify(
		// Region signals persist across navigations, so ids must be unique.
		typeof region === 'string'
			? `${ namespace }/${ region }`
			: { ...region, id: `${ namespace }/${ region.id }` }
	) }'${ attrs }>${ content }</div>`;

/**
 * Wraps content in an interactive element of the given namespace.
 *
 * @param content Content of the interactive element.
 * @param ns      Namespace of the interactive element.
 * @return Markup.
 */
const island = ( content: string, ns = namespace ) =>
	`<div data-wp-interactive="${ ns }">${ content }</div>`;

/**
 * Navigates using supplied destination markup and waits for directive effects.
 *
 * @param body Destination body markup.
 * @return A promise resolving after navigation and its scheduled frames.
 */
const navigate = async ( body: string ) => {
	await actions.navigate( url, {
		...quiet,
		html: pageHtml( body ),
		force: true,
	} );
	await nextFrames();
};

// Let the runtime finish preparing the empty initial document before fixtures.
beforeAll( nextFrames );

beforeEach( () => {
	document.body.innerHTML = '';
	namespace = `test/router-inherited-${ ++testCount }`;
	url = `http://localhost/inherited-${ testCount }`;
	marks = 0;
	presses = 0;
	store( namespace, {
		state: {
			// Distinguishes the namespace the directives resolve against.
			who: 'live',
			// Empty owned content unless a test supplies a token.
			html: null,
		},
		actions: {
			/** Records the observable initialization of an interactive island. */
			mark() {
				marks++;
			},
		},
	} );
	store( `${ namespace }-destination`, {
		state: { who: 'destination' },
	} );
	store( `${ namespace }-inner`, {
		state: { who: 'inner' },
		actions: {
			/** Counts the presses of the button of the nested namespace. */
			press() {
				presses++;
			},
		},
	} );
} );

test( 'keeps a region nested in another region and updates it as part of its parent', async () => {
	const body = ( letter: string ) =>
		island(
			regionHtml(
				`<p>parent ${ letter }</p>${ regionHtml(
					`<span data-wp-init="actions.mark">child ${ letter }</span>`,
					'child'
				) }`
			)
		);
	const live = hydrateHtml( body( 'A' ) );
	expect( live ).toHaveTextContent( 'parent Achild A' );
	marks = 0;

	await navigate( body( 'B' ) );

	expect( live ).toHaveTextContent( 'parent Bchild B' );
	expect( live.querySelectorAll( '[data-wp-router-region]' ) ).toHaveLength(
		2
	);
} );

test( 'attaches a region absent from the live page and resolves its directives against the destination namespace', async () => {
	hydrateHtml( island( regionHtml( '<p>A</p>' ) ) );
	const overlay = regionHtml(
		'<p class="overlay" data-wp-text="state.who">server</p>',
		{ id: 'overlay', attachTo: 'body' }
	);

	await navigate(
		island(
			regionHtml( '<p>B</p>' ) + overlay,
			`${ namespace }-destination`
		)
	);

	const overlays = document.querySelectorAll( '.overlay' );
	expect( overlays ).toHaveLength( 1 );
	expect( overlays[ 0 ] ).toHaveTextContent( 'destination' );
	expect(
		overlays[ 0 ].closest( '[data-wp-router-region]' )!.parentElement
	).toBe( document.body );
} );

test( 'ignores regions inside data-wp-html content as source and as attachment', async () => {
	const live = hydrateHtml( island( regionHtml( '<p>A</p>' ) ) );
	// A missing region unmounts its root, not just its children.
	await navigate( island( '<p>no region</p>' ) );
	const absentContent = live.innerHTML;
	expect( absentContent ).toBe( '' );
	await navigate( island( regionHtml( '<p>A</p>' ) ) );

	await navigate(
		island(
			`<div data-wp-html="state.html">${ regionHtml(
				'<p data-wp-init="actions.mark">copy</p>'
			) }${ regionHtml( '<p class="overlay">overlay</p>', {
				id: 'overlay',
				attachTo: 'body',
			} ) }</div>`
		)
	);

	expect( live.innerHTML ).toBe( absentContent );
	expect( marks ).toBe( 0 );
	expect( document.body ).not.toHaveTextContent( 'copy' );
	expect( document.querySelector( '.overlay' ) ).toBeNull();
} );

test( 'updates a region carrying data-wp-html', async () => {
	store( namespace, {
		state: {
			// The conflicting HTML directive must never render this token.
			html: asDangerousHTML( '<b>token</b>' ),
		},
	} );
	const body = ( content: string ) =>
		island(
			regionHtml(
				`<p>${ content }</p>`,
				'html',
				' data-wp-html="state.html"'
			)
		);
	const live = hydrateHtml( body( 'current' ) );
	expect( live ).toHaveTextContent( 'current' );

	await navigate( body( 'destination' ) );

	expect( live ).toHaveTextContent( 'destination' );
	expect( live ).not.toHaveTextContent( 'token' );
	expect( console ).toHaveWarnedWith(
		'The data-wp-html directive was ignored because it conflicts with data-wp-router-region.'
	);
} );

test( 'resolves a region against the object-form or nearest enclosing namespace of each page through navigation and history', async () => {
	const region = regionHtml(
		'<p class="who" data-wp-text="state.who">server</p><div data-wp-context=\'{ "label": "context" }\'><p class="label" data-wp-text="context.label">server</p></div><button data-wp-on--click="actions.press">press</button>'
	);
	const live = hydrateHtml( island( region ) );
	const who = () => live.querySelector( '.who' )!.textContent;
	const label = () => live.querySelector( '.label' )!.textContent;
	expect( who() ).toBe( 'live' );
	expect( label() ).toBe( 'context' );

	// The enclosing namespace is in the object form.
	await actions.navigate( `${ url }/object`, {
		...quiet,
		html: pageHtml(
			`<div data-wp-interactive='${ JSON.stringify( {
				namespace: `${ namespace }-destination`,
			} ) }'>${ region }</div>`
		),
	} );
	await nextFrames();
	expect( who() ).toBe( 'destination' );
	expect( label() ).toBe( 'context' );

	// Two nested enclosing namespaces: the inner one applies.
	await actions.navigate( `${ url }/nested`, {
		...quiet,
		html: pageHtml(
			island(
				island( region, `${ namespace }-inner` ),
				`${ namespace }-destination`
			)
		),
	} );
	await nextFrames();
	expect( who() ).toBe( 'inner' );
	expect( label() ).toBe( 'context' );
	live.querySelector( 'button' )!.click();
	await nextFrames();
	expect( presses ).toBe( 1 );

	traverseTo( `/inherited-${ testCount }/object` );
	await nextFrames();
	expect( who() ).toBe( 'destination' );
	expect( label() ).toBe( 'context' );

	traverseTo( `/inherited-${ testCount }/nested` );
	await nextFrames();
	expect( who() ).toBe( 'inner' );
	live.querySelector( 'button' )!.click();
	await nextFrames();
	expect( presses ).toBe( 2 );
} );
