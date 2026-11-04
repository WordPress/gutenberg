/**
 * A `data-wp-html` element that navigation keeps shows the new page's
 * server-rendered content while its value is `{ "wpServerHtml": true }`. The
 * router is imported once because it registers global listeners; each test
 * uses fresh stores, regions and URLs so its DOM and cached pages are
 * independent.
 */
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import {
	asDangerousHTML,
	getServerContext,
	getServerState,
	privateApis,
	store,
} from '@wordpress/interactivity';
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

const { populateServerData } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

// Distinguish singleton store registrations and cached destination URLs.
let testCount = 0;
// Namespace shared by the current test's markup and stores.
let namespace: string;
// Destination URL prefix unique to the current test.
let url: string;

/** The server's representation of an `asDangerousHTML()` value. */
const representation = { wpServerHtml: true };

/**
 * Builds the current test's router region.
 *
 * @param content Region content.
 * @param context Optional `data-wp-context` value of the region.
 * @return Region markup.
 */
const regionHtml = ( content: string, context?: object ) =>
	`<div data-wp-interactive="${ namespace }" data-wp-router-region="${ namespace }/r"${
		context ? ` data-wp-context='${ JSON.stringify( context ) }'` : ''
	}>${ content }</div>`;

/**
 * Builds the server data script of a destination page.
 *
 * @param data Server data, as WordPress serializes it.
 * @return Script markup.
 */
const serverDataHtml = ( data: object ) =>
	`<script type="application/json" id="wp-script-module-data-@wordpress/interactivity">${ JSON.stringify(
		data
	) }</script>`;

/**
 * Navigates to a page of the current test using supplied destination markup
 * and waits for directive effects.
 *
 * @param page Page name, appended to the test's URL.
 * @param body Destination body markup.
 * @return A promise resolving after navigation and its scheduled frames.
 */
const navigate = async ( page: string, body: string ) => {
	await actions.navigate( `${ url }-${ page }`, {
		...quiet,
		html: pageHtml( body ),
		force: true,
	} );
	await nextFrames();
};

/**
 * Records the region's content and the element's HTML each time a mutation
 * observer is notified, which happens only after a whole update.
 *
 * @param region  The router region.
 * @param element The kept element.
 * @return The recorded `[ region text, element HTML ]` pairs.
 */
const recordUpdates = ( region: Element, element: Element ) => {
	const updates: Array< [ string, string ] > = [];
	new MutationObserver( () =>
		updates.push( [
			region.querySelector( '.content' )!.textContent!,
			element.innerHTML,
		] )
	).observe( region, {
		childList: true,
		subtree: true,
		characterData: true,
	} );
	return updates;
};

// Let the runtime finish preparing the empty initial document before fixtures.
beforeAll( nextFrames );

beforeEach( () => {
	document.body.innerHTML = '';
	namespace = `test/router-html-server-${ ++testCount }`;
	url = `http://localhost/html-server-content-${ testCount }`;
} );

describe( 'a data-wp-html element kept across navigation', () => {
	test.each( [
		[ 'a state path', 'state.html' ],
		[ 'a context path', 'context.html' ],
		[ 'a getServerState() getter', 'state.fromServerState' ],
		[ 'a getServerContext() getter', 'state.fromServerContext' ],
	] )(
		'shows the new page’s server content for the server representation from %s',
		async ( _, reference ) => {
			store( namespace, {
				state: {
					html: representation,
					/** Reads the value of the page being rendered. */
					get fromServerState() {
						return getServerState().html;
					},
					/** Reads the context of the page being rendered. */
					get fromServerContext() {
						return getServerContext().html;
					},
				},
			} );
			const page = ( name: string ) =>
				regionHtml(
					`<p class="content">${ name }</p><div data-wp-html="${ reference }"><i>${ name }</i></div>`,
					{ html: representation }
				);
			populateServerData( {
				state: { [ namespace ]: { html: representation } },
			} );
			const region = hydrateHtml( page( 'one' ) );
			const element = region.querySelector( '[data-wp-html]' )!;
			expect( element.innerHTML ).toBe( '<i>one</i>' );

			await navigate(
				'two',
				page( 'two' ) +
					serverDataHtml( {
						state: { [ namespace ]: { html: representation } },
					} )
			);

			expect( region.querySelector( '[data-wp-html]' ) ).toBe( element );
			expect( element.innerHTML ).toBe( '<i>two</i>' );
		}
	);

	test.each( [ 'T', 'null' ] )(
		'shows the new page’s server content in the update that brings it after %s',
		async ( previous ) => {
			store( namespace, {
				state: {
					/** Selects the value from the page's server context. */
					get html() {
						const { value } = getServerContext< {
							value: string;
						} >();
						if ( value === 'M' ) {
							return representation;
						}
						return value === 'T'
							? asDangerousHTML( '<p>T</p>' )
							: null;
					},
				},
			} );
			const page = (
				name: string,
				value: string,
				full: string,
				empty: string
			) =>
				regionHtml(
					`<p class="content">${ name }</p><div class="full" data-wp-html="state.html">${ full }</div><div class="empty" data-wp-html="state.html">${ empty }</div>`,
					{ value }
				);
			// What the server renders for the value on the previous page.
			const shown = previous === 'T' ? '<p>T</p>' : '';
			const region = hydrateHtml( page( 'one', previous, shown, shown ) );
			const [ full, empty ] = region.querySelectorAll( '[data-wp-html]' );
			expect( [ full.innerHTML, empty.innerHTML ] ).toEqual( [
				shown,
				shown,
			] );
			const updates = recordUpdates( region, full );

			await navigate( 'two', page( 'two', 'M', '<i>two</i>', '' ) );

			expect( region.querySelector( '.full' ) ).toBe( full );
			expect( full.innerHTML ).toBe( '<i>two</i>' );
			expect( empty ).toBeEmptyDOMElement();
			expect( updates ).toEqual( [ [ 'two', '<i>two</i>' ] ] );
		}
	);

	test( 'shows each page’s server content on prefetched, cached, restored and refreshed pages', async () => {
		store( namespace, {
			state: {
				/** Selects the value from the page's server context. */
				get html() {
					return getServerContext< { value: string } >().value === 'T'
						? asDangerousHTML( '<p>T</p>' )
						: representation;
				},
			},
		} );
		const page = ( name: string, value = 'M' ) =>
			regionHtml(
				`<p class="content">${ name }</p><div data-wp-html="state.html"><i>${ name }</i></div>`,
				{ value }
			);
		const region = hydrateHtml( page( 'zero' ) );
		const element = region.querySelector( '[data-wp-html]' )!;
		const show = () => [
			region.querySelector( '[data-wp-html]' ) === element,
			element.innerHTML,
		];

		await navigate( 'one', page( 'one' ) );
		expect( show() ).toEqual( [ true, '<i>one</i>' ] );

		await actions.prefetch( `${ url }-two`, {
			html: pageHtml( page( 'two' ) ),
		} );
		await actions.navigate( `${ url }-two`, quiet );
		await nextFrames();
		expect( show() ).toEqual( [ true, '<i>two</i>' ] );

		await navigate( 'three', page( 'three', 'T' ) );
		expect( show() ).toEqual( [ true, '<p>T</p>' ] );

		for ( const [ name, html ] of [
			[ 'two', '<i>two</i>' ],
			[ 'one', '<i>one</i>' ],
			[ 'two', '<i>two</i>' ],
			[ 'three', '<p>T</p>' ],
			[ 'two', '<i>two</i>' ],
		] ) {
			traverseTo( `${ url }-${ name }` );
			await nextFrames();
			expect( show() ).toEqual( [ true, html ] );
		}

		await navigate(
			'two',
			page( 'two' ).replace( 'two</i>', 'changed</i>' )
		);
		expect( show() ).toEqual( [ true, '<i>changed</i>' ] );
	} );

	test( 'shows only its own server content, inert and without scripts', async () => {
		let initCalls = 0;
		const { state } = store( namespace, {
			state: { active: false, text: 'dynamic' },
		} );
		store( `${ namespace }-other`, {
			callbacks: {
				/** Records an initialization of the island in the content. */
				init() {
					initCalls++;
				},
			},
		} );
		const context = {
			html: {
				...representation,
				html: '<img src=x onerror=alert(1)>',
				__html: '<b>x</b>',
			},
		};
		const page = ( name: string, content: string ) =>
			regionHtml(
				`<p class="content">${ name }</p><div data-wp-html="context.html" data-wp-class--active="state.active">${ content }</div>`,
				context
			);
		const region = hydrateHtml( page( 'one', '<p>One</p>' ) );
		const element =
			region.querySelector< HTMLElement >( '[data-wp-html]' )!;
		const updates = recordUpdates( region, element );

		await navigate(
			'two',
			page(
				'two',
				`<span data-wp-text="state.text">static</span><div data-wp-interactive="${ namespace }-other" data-wp-init="callbacks.init"></div><div><script>window.runs = ( window.runs || 0 ) + 1;</script></div><script>window.runs = ( window.runs || 0 ) + 1;</script>`
			)
		);
		state.text = 'changed';
		state.active = true;
		await nextFrames();

		expect( element ).toHaveClass( 'active' );
		expect( element.innerHTML ).toBe(
			`<span data-wp-text="state.text">static</span><div data-wp-interactive="${ namespace }-other" data-wp-init="callbacks.init"></div><div></div>`
		);
		expect( initCalls ).toBe( 0 );
		expect(
			( window as typeof window & { runs?: number } ).runs
		).toBeUndefined();
		for ( const [ , html ] of updates ) {
			expect( html ).not.toMatch( /<img|<b>/ );
		}
	} );

	test( 'follows its value after showing the new page’s server content', async () => {
		const { state } = store( namespace, {
			state: {
				active: false,
				html: representation as unknown,
			},
		} );
		const page = ( name: string ) =>
			regionHtml(
				`<p class="content">${ name }</p><div data-wp-html="state.html" data-wp-class--active="state.active"><p>${ name }</p></div>`
			);
		const region = hydrateHtml( page( 'One' ) );
		const element =
			region.querySelector< HTMLElement >( '[data-wp-html]' )!;

		await navigate( 'two', page( 'Two' ) );
		expect( element.innerHTML ).toBe( '<p>Two</p>' );
		const paragraph = element.firstChild;
		const mutations: MutationRecord[] = [];
		const observer = new MutationObserver( ( records ) =>
			mutations.push( ...records )
		);
		observer.observe( element, { childList: true } );

		state.active = true;
		await nextFrames();
		state.html = asDangerousHTML( '<p>Two</p>' );
		await nextFrames();
		expect( element ).toHaveClass( 'active' );
		expect( element.firstChild ).toBe( paragraph );
		expect( mutations ).toHaveLength( 0 );

		state.html = null;
		await nextFrames();
		expect( element ).toBeEmptyDOMElement();
		observer.disconnect();
	} );

	test( 'keeps its content in a list item, never showing the template’s', async () => {
		store( namespace, {
			state: {
				list: [
					{ id: 1, html: representation },
					{ id: 2, html: representation },
				],
			},
		} );
		const page = ( name: string ) =>
			regionHtml(
				`<p class="content">${ name }</p><ul><template data-wp-each="state.list" data-wp-each-key="context.item.id"><li><span data-wp-html="context.item.html"><i>Template ${ name }</i></span></li></template></ul>`
			);
		const region = hydrateHtml(
			regionHtml( '<p class="content">zero</p>' )
		);
		await navigate( 'one', page( 'one' ) );
		const items = [ ...region.querySelectorAll( 'li' ) ];
		expect( items.map( ( item ) => item.innerHTML ) ).toEqual(
			Array( 2 ).fill(
				'<span data-wp-html="context.item.html"><i>Template one</i></span>'
			)
		);
		const updates = recordUpdates( region, region.querySelector( 'ul' )! );

		await navigate( 'two', page( 'two' ) );

		expect( [ ...region.querySelectorAll( 'li' ) ] ).toEqual( items );
		expect( items.map( ( item ) => item.innerHTML ) ).toEqual(
			Array( 2 ).fill(
				'<span data-wp-html="context.item.html"><i>Template one</i></span>'
			)
		);
		for ( const [ , html ] of updates ) {
			expect( html ).not.toContain( 'Template two' );
		}
	} );
} );
