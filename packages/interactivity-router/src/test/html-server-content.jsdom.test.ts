/**
 * A `data-wp-html` element that navigation keeps shows the new page's
 * server-rendered content while its value is `{ "wpServerHtml": true }` or
 * pending. The router is imported once because it registers global listeners;
 * each test uses fresh stores, regions and URLs so its DOM and cached pages
 * are independent.
 */
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import {
	asDangerousHTML,
	getContext,
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
 * Builds the server data that declares `state.late` as derived state the
 * client hasn't defined, so its value is pending.
 *
 * @param state Server state of the current test's namespace.
 * @return Server data, as WordPress serializes it.
 */
const pendingServerData = ( state: object = {} ) => ( {
	state: { [ namespace ]: { ...state, late: {} } },
	derivedStateClosures: { [ namespace ]: [ 'state.late' ] },
} );

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
		[ 'the server representation in a state path', 'state.html' ],
		[ 'the server representation in a context path', 'context.html' ],
		[
			'the server representation from a getServerState() getter',
			'state.fromServerState',
		],
		[
			'the server representation from a getServerContext() getter',
			'state.fromServerContext',
		],
		[ 'a pending value', 'state.late' ],
	] )(
		'shows the new page’s server content for %s',
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
			const serverData = pendingServerData( { html: representation } );
			populateServerData( serverData );
			const region = hydrateHtml( page( 'one' ) );
			const element = region.querySelector( '[data-wp-html]' )!;
			expect( element.innerHTML ).toBe( '<i>one</i>' );

			await navigate(
				'two',
				page( 'two' ) + serverDataHtml( serverData )
			);

			expect( region.querySelector( '[data-wp-html]' ) ).toBe( element );
			expect( element.innerHTML ).toBe( '<i>two</i>' );
		}
	);

	// Values on the previous and new page: `T`, a token; `null`; `M`, the
	// server representation; `P`, a pending value. A `getServerContext()`
	// getter returns the new value in a second render of the same update.
	test.each( [
		[ 'T', 'M' ],
		[ 'null', 'M' ],
		[ 'T', 'P' ],
	] )(
		'shows the new page’s server content in the update that brings it, from %s to %s',
		async ( previous, next ) => {
			populateServerData( pendingServerData() );
			const { state } = store( namespace, {
				state: {
					/** Selects the value from the page's server context. */
					get html(): unknown {
						const { value } = getServerContext< {
							value: string;
						} >();
						if ( value === 'M' ) {
							return representation;
						}
						if ( value === 'P' ) {
							return state.late;
						}
						return value === 'T'
							? asDangerousHTML( '<p>T</p>' )
							: null;
					},
				} as { html: unknown; late?: unknown },
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

			await navigate( 'two', page( 'two', next, '<i>two</i>', '' ) );

			expect( region.querySelector( '.full' ) ).toBe( full );
			expect( full.innerHTML ).toBe( '<i>two</i>' );
			expect( empty ).toBeEmptyDOMElement();
			expect( updates ).toEqual( [ [ 'two', '<i>two</i>' ] ] );
		}
	);

	/**
	 * Navigates a kept element whose getter returns the server representation
	 * on the previous page and a token or `null` on the new one.
	 *
	 * @param source The server data the getter reads.
	 * @param next   The value on the new page: `T`, a token, or `null`.
	 * @return The element and the nodes added to it during the navigation.
	 */
	const navigateFromRepresentation = async (
		source: 'getServerState()' | 'getServerContext()',
		next: string
	) => {
		store( namespace, {
			state: {
				/** Selects the value from the page's server data. */
				get html(): unknown {
					const { value } =
						source === 'getServerContext()'
							? getServerContext< { value: string } >()
							: getServerState< { value: string } >();
					if ( value === 'M' ) {
						return representation;
					}
					return value === 'T' ? asDangerousHTML( '<p>T</p>' ) : null;
				},
			},
		} );
		const serverData = ( value: string ) => ( {
			state: { [ namespace ]: { value } },
		} );
		const page = ( name: string, value: string, content: string ) =>
			regionHtml(
				`<p class="content">${ name }</p><div data-wp-html="state.html">${ content }</div>`,
				{ value }
			) + serverDataHtml( serverData( value ) );
		populateServerData( serverData( 'M' ) );
		const region = hydrateHtml( page( 'one', 'M', '<i>one</i>' ) );
		const element = region.querySelector( '[data-wp-html]' )!;
		expect( element.innerHTML ).toBe( '<i>one</i>' );
		const added: string[] = [];
		const observer = new MutationObserver( ( records ) =>
			records.forEach( ( record ) =>
				record.addedNodes.forEach( ( node ) =>
					added.push( ( node as Element ).outerHTML )
				)
			)
		);
		observer.observe( element, { childList: true } );

		await navigate( 'two', page( 'two', next, '<i>two</i>' ) );
		observer.disconnect();

		expect( region.querySelector( '[data-wp-html]' ) ).toBe( element );
		return { element, added };
	};

	test.each( [ 'T', 'null' ] )(
		'never shows the new page’s server content when a getServerState() getter turns from the server representation into %s',
		async ( next ) => {
			const { element, added } = await navigateFromRepresentation(
				'getServerState()',
				next
			);

			expect( element.innerHTML ).toBe( next === 'T' ? '<p>T</p>' : '' );
			expect( added ).not.toContain( '<i>two</i>' );
		}
	);

	// A getter reading the server context returns the previous page's value in
	// the update's first render, so the element can receive the new page's
	// content before the token's HTML replaces it.
	test.each( [ 'T', 'null' ] )(
		'ends with the value of a getServerContext() getter that turns from the server representation into %s',
		async ( next ) => {
			const { element } = await navigateFromRepresentation(
				'getServerContext()',
				next
			);

			expect( element.innerHTML ).toBe( next === 'T' ? '<p>T</p>' : '' );
		}
	);

	// Values on the previous page: `null`; `T`, a token an action set there;
	// `M`, the server representation. On every page, a `data-wp-watch`
	// callback copies the page's server value into the element's value one
	// frame after the navigation renders.
	test.each( [
		[ 'getServerState()', 'null' ],
		[ 'getServerState()', 'T' ],
		[ 'getServerState()', 'M' ],
		[ 'getServerContext()', 'null' ],
	] )(
		'shows the new page’s server content once a data-wp-watch callback copies the server representation from %s, from %s',
		async ( source, previous ) => {
			const fromContext = source === 'getServerContext()';
			const { state } = store( namespace, {
				state: {} as { html: unknown },
				callbacks: {
					/** Copies the page's server value into the element's value. */
					sync() {
						if ( fromContext ) {
							getContext< { html: unknown } >().html =
								getServerContext< { html: unknown } >().html;
						} else {
							state.html = getServerState< {
								html: unknown;
							} >().html;
						}
					},
				},
			} );
			const page = ( name: string, html: unknown, content: string ) =>
				`<div data-wp-interactive="${ namespace }" data-wp-router-region="${ namespace }/r"${
					fromContext
						? ` data-wp-context='${ JSON.stringify( { html } ) }'`
						: ''
				} data-wp-watch="callbacks.sync"><p class="content">${ name }</p><div data-wp-html="${
					fromContext ? 'context.html' : 'state.html'
				}">${ content }</div></div>`;
			const serverData = ( html: unknown ) => ( {
				state: { [ namespace ]: { html } },
			} );
			const previousValue = previous === 'M' ? representation : null;
			// What the server renders for the value on the previous page.
			const previousContent = previous === 'M' ? '<p>One</p>' : '';
			populateServerData( serverData( previousValue ) );
			const region = hydrateHtml(
				page( 'zero', previousValue, previousContent )
			);
			const element = region.querySelector( '[data-wp-html]' )!;
			await navigate(
				'one',
				page( 'one', previousValue, previousContent ) +
					serverDataHtml( serverData( previousValue ) )
			);
			if ( previous === 'T' ) {
				state.html = asDangerousHTML( '<p>Client</p>' );
				await nextFrames();
			}
			const shown = previous === 'T' ? '<p>Client</p>' : previousContent;
			expect( element.innerHTML ).toBe( shown );
			const updates = recordUpdates( region, element );

			await navigate(
				'two',
				page( 'two', representation, '<i>two</i>' ) +
					serverDataHtml( serverData( representation ) )
			);

			expect( region.querySelector( '[data-wp-html]' ) ).toBe( element );
			expect( element.innerHTML ).toBe( '<i>two</i>' );
			// A synced value arrives in the update after the one that shows the
			// new page; a value that already was the representation changes
			// nothing then.
			expect( updates ).toEqual(
				previous === 'M'
					? [ [ 'two', '<i>two</i>' ] ]
					: [
							[ 'two', shown ],
							[ 'two', '<i>two</i>' ],
						]
			);

			traverseTo( `${ url }-one` );
			await nextFrames();
			expect( element.innerHTML ).toBe( previousContent );
			traverseTo( `${ url }-two` );
			await nextFrames();
			expect( region.querySelector( '[data-wp-html]' ) ).toBe( element );
			expect( element.innerHTML ).toBe( '<i>two</i>' );
		}
	);

	test.each( [
		[ 'a token', 'the server representation' ],
		[ 'null', 'the server representation' ],
		[ 'a token', 'a pending value' ],
	] )(
		'keeps its content when a change on the same page after the navigation turns %s into %s',
		async ( first, later ) => {
			populateServerData( pendingServerData() );
			const { state } = store( namespace, {
				state: {
					changed: false,
					/** Selects the value before and after the same-page change. */
					get html(): unknown {
						if ( ! state.changed ) {
							return first === 'null'
								? null
								: asDangerousHTML( '<p>Token</p>' );
						}
						return later === 'a pending value'
							? state.late
							: representation;
					},
				} as { changed: boolean; html: unknown; late?: unknown },
			} );
			const page = ( name: string, content: string ) =>
				regionHtml(
					`<p class="content">${ name }</p><div data-wp-html="state.html">${ content }</div>`
				);
			const shown = first === 'null' ? '' : '<p>Token</p>';
			const region = hydrateHtml( page( 'one', shown ) );
			const element = region.querySelector( '[data-wp-html]' )!;
			const updates = recordUpdates( region, element );

			// The navigation helper waits for the frames in which the
			// navigation's `data-wp-watch` callbacks run, so the change comes
			// after them.
			await navigate( 'two', page( 'two', '<i>two</i>' ) );
			expect( element.innerHTML ).toBe( shown );
			state.changed = true;
			await nextFrames();

			expect( region.querySelector( '[data-wp-html]' ) ).toBe( element );
			expect( element.innerHTML ).toBe( shown );
			for ( const [ , html ] of updates ) {
				expect( html ).not.toContain( '<i>two</i>' );
			}
		}
	);

	test( 'shows each page’s server content on prefetched, cached, restored and refreshed pages', async () => {
		store( namespace, {
			state: {
				/**
				 * Selects the value from the page's server state, which holds
				 * the new page's value from the update that renders it.
				 */
				get html() {
					return getServerState< { value: string } >().value === 'T'
						? asDangerousHTML( '<p>T</p>' )
						: representation;
				},
			},
		} );
		const serverData = ( value: string ) => ( {
			state: { [ namespace ]: { value } },
		} );
		const page = ( name: string, value = 'M' ) =>
			regionHtml(
				`<p class="content">${ name }</p><div data-wp-html="state.html"><i>${ name }</i></div>`
			) + serverDataHtml( serverData( value ) );
		populateServerData( serverData( 'M' ) );
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

	test( 'keeps its nodes and the changes made in them while the new page’s server content is the same', async () => {
		store( namespace, { state: { html: representation } } );
		const serverData = pendingServerData();
		// The content differs between pages only inside its `<template>`.
		const page = ( name: string, template: string ) =>
			regionHtml(
				`<p class="content">${ name }</p>${ [
					'state.html',
					'state.late',
				]
					.map(
						( reference ) =>
							`<div data-wp-html="${ reference }"><details><summary>Same</summary><p>content</p></details><template><b>${ template }</b></template><script>window.kept = 1;</script></div>`
					)
					.join( '' ) }`
			) + serverDataHtml( serverData );
		populateServerData( serverData );
		const region = hydrateHtml( page( 'one', 'one' ) );
		const elements = [ ...region.querySelectorAll( '[data-wp-html]' ) ];
		// The visitor opens the details, and a script marks the paragraph.
		for ( const element of elements ) {
			element.querySelector( 'details' )!.open = true;
			element.querySelector( 'p' )!.classList.add( 'js' );
		}
		const changed =
			'<details open=""><summary>Same</summary><p class="js">content</p></details><template><b>one</b></template><script>window.kept = 1;</script>';
		const mutations: MutationRecord[] = [];
		const observer = new MutationObserver( ( records ) =>
			mutations.push( ...records )
		);
		for ( const element of elements ) {
			observer.observe( element, {
				childList: true,
				subtree: true,
				characterData: true,
			} );
		}

		await navigate( 'two', page( 'two', 'one' ) );
		// Refreshing the page shown fetches it again.
		await navigate( 'two', page( 'two', 'one' ) );

		expect( region.querySelector( '.content' ) ).toHaveTextContent( 'two' );
		expect( elements.map( ( element ) => element.innerHTML ) ).toEqual( [
			changed,
			changed,
		] );
		expect( mutations ).toHaveLength( 0 );
		observer.disconnect();

		await navigate( 'three', page( 'three', 'three' ) );

		expect( elements.map( ( element ) => element.innerHTML ) ).toEqual(
			Array( 2 ).fill(
				'<details><summary>Same</summary><p>content</p></details><template><b>three</b></template>'
			)
		);
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

	test( 'writes a token it showed before the navigation once its pending value resolves to it', async () => {
		const serverData = pendingServerData();
		populateServerData( serverData );
		const { state } = store( namespace, {
			state: {
				/** Selects the value from the page's server context. */
				get html(): unknown {
					return getServerContext< { value: string } >().value === 'T'
						? asDangerousHTML( '<p>T</p>' )
						: state.late;
				},
			} as { html: unknown; late?: unknown },
		} );
		const page = ( name: string, value: string, content: string ) =>
			regionHtml(
				`<p class="content">${ name }</p><div data-wp-html="state.html">${ content }</div>`,
				{ value }
			);
		const region = hydrateHtml( page( 'one', 'T', '<p>T</p>' ) );
		const element = region.querySelector( '[data-wp-html]' )!;

		await navigate(
			'two',
			page( 'two', 'P', '<i>two</i>' ) + serverDataHtml( serverData )
		);
		expect( element.innerHTML ).toBe( '<i>two</i>' );

		store( namespace, {
			state: {
				/** Resolves the pending value to the previous page's token. */
				get late() {
					return asDangerousHTML( '<p>T</p>' );
				},
			},
		} );
		await nextFrames();
		expect( element.innerHTML ).toBe( '<p>T</p>' );
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
