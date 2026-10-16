import {
	afterEach,
	describe,
	expect,
	it,
	beforeEach,
	vi,
	type MockInstance,
} from 'vitest';
import { hydrate, options } from 'preact';
import { act } from 'preact/test-utils';
import '../index'; // Registers all core directives, including `html`.
import { toVdom } from '../../vdom';
import { populateServerData, store } from '../../store';
import { asDangerousHTML, type DangerousHTML } from '../../html';
import { getScope, resetScope } from '../../scopes';

/** Preserves the renderer's directive registry between isolated runtimes. */
let originalVNodeHook: typeof options.vnode;

beforeEach( () => {
	originalVNodeHook = options.vnode;
	document.body.innerHTML = '';
} );

afterEach( () => {
	options.vnode = originalVNodeHook;
	vi.unstubAllGlobals();
} );

let namespaceCount = 0;

// Each test gets its own store namespace: the store registry is a module
// singleton, so reusing a namespace across tests would leak state.
function uniqueNamespace(): string {
	return `test/html-${ ++namespaceCount }`;
}

function createRegion( namespace: string, innerHtml: string ): HTMLElement {
	const container = document.createElement( 'div' );
	container.innerHTML = `<div data-wp-interactive='{ "namespace": "${ namespace }" }'>${ innerHtml }</div>`;
	document.body.appendChild( container );
	return container.firstElementChild as HTMLElement;
}

/**
 * Records content writes while preserving the element's native DOM behavior.
 *
 * @param target The element whose content writes should be observed.
 * @return The HTML values written to the element, in order.
 */
function recordHtmlWrites( target: HTMLElement ): string[] {
	// Native accessors retain serialization and node replacement behavior.
	const descriptor = Object.getOwnPropertyDescriptor(
		Element.prototype,
		'innerHTML'
	)!;
	// Writes are observed from before hydration through subsequent updates.
	const writes: string[] = [];
	Object.defineProperty( target, 'innerHTML', {
		// Allow the accessor to be removed with the test element.
		configurable: true,
		/**
		 * Serializes the element's current content.
		 *
		 * @return The native HTML serialization.
		 */
		get: () => descriptor.get!.call( target ),
		/**
		 * Records a write and applies it with the native setter.
		 *
		 * @param value The HTML assigned to the element.
		 */
		set: ( value: string ) => {
			writes.push( value );
			descriptor.set!.call( target, value );
		},
	} );
	return writes;
}

describe( 'data-wp-html', () => {
	it.each( [ false, true ] )(
		'keeps the server-rendered content for the server representation at hydration and on re-render (listed as derived state: %s)',
		async ( listed ) => {
			vi.stubGlobal( 'SCRIPT_DEBUG', true );
			const runtime = await loadConflictRuntime();
			const namespace = uniqueNamespace();
			runtime.populateServerData( {
				state: { [ namespace ]: { html: { wpServerHtml: true } } },
				...( listed && {
					derivedStateClosures: { [ namespace ]: [ 'state.html' ] },
				} ),
			} );
			const { state } = runtime.store( namespace, {
				state: { active: false },
			} );
			const region = createRegion(
				namespace,
				'<div data-wp-html="state.html" data-wp-class--active="state.active"><p>Server</p></div>'
			);
			const target = region.querySelector( 'div' )!;
			const serverNode = target.firstElementChild;
			const writes = recordHtmlWrites( target );
			const warnings = vi.spyOn( console, 'warn' );

			await runtime.act( () =>
				runtime.hydrate( runtime.toVdom( region ), region.parentNode! )
			);
			await runtime.act( () => {
				state.active = true;
			} );
			expect( target ).toHaveClass( 'active' );
			expect( target.firstElementChild ).toBe( serverNode );
			expect( writes ).toEqual( [] );
			expect( warnings ).not.toHaveBeenCalled();
		}
	);

	it( 'keeps the server-rendered content for the server representation reached through context or a function', async () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', true );
		const runtime = await loadConflictRuntime();
		const namespace = uniqueNamespace();
		let context!: { html: unknown };
		runtime.store( namespace, {
			callbacks: {
				getHtml() {
					context = runtime.getContext< { html: unknown } >();
					return context.html;
				},
			},
		} );
		const region = createRegion(
			namespace,
			`<div data-wp-context='{ "html": { "wpServerHtml": true } }'><div data-wp-html="context.html"><p>Server</p></div><div data-wp-html="callbacks.getHtml"><p>Server</p></div></div>`
		);
		const targets = [
			...region.querySelectorAll< HTMLElement >( '[data-wp-html]' ),
		];
		const serverNodes = targets.map(
			( target ) => target.firstElementChild
		);
		const writes = targets.map( recordHtmlWrites );
		const warnings = vi.spyOn( console, 'warn' );

		await runtime.act( () =>
			runtime.hydrate( runtime.toVdom( region ), region.parentNode! )
		);
		targets.forEach( ( target, index ) =>
			expect( target.firstElementChild ).toBe( serverNodes[ index ] )
		);
		expect( writes ).toEqual( [ [], [] ] );
		expect( warnings ).not.toHaveBeenCalled();

		await runtime.act( () => {
			context.html = runtime.asDangerousHTML( '<p>Client</p>' );
		} );
		expect( targets.map( ( target ) => target.innerHTML ) ).toEqual( [
			'<p>Client</p>',
			'<p>Client</p>',
		] );
	} );

	it( 'follows the values that replace the server representation', async () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', true );
		const runtime = await loadConflictRuntime();
		const namespace = uniqueNamespace();
		const { state } = runtime.store( namespace, {
			state: { html: { wpServerHtml: true } as unknown },
		} );
		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html"><p>Server</p></div>'
		);
		const target = region.querySelector( 'div' )!;
		const serverNode = target.firstElementChild;
		const writes = recordHtmlWrites( target );
		await runtime.act( () =>
			runtime.hydrate( runtime.toVdom( region ), region.parentNode! )
		);

		// A token whose HTML matches the kept content keeps its nodes.
		await runtime.act( () => {
			state.html = runtime.asDangerousHTML( '<p>Server</p>' );
		} );
		expect( target.firstElementChild ).toBe( serverNode );
		expect( writes ).toEqual( [] );

		// The DOM serializes this HTML as `<p><a href="/x">Link</a></p>`.
		await runtime.act( () => {
			state.html = runtime.asDangerousHTML(
				'<p><a href=/x>Link</a></p>'
			);
		} );
		expect( writes ).toEqual( [ '<p><a href=/x>Link</a></p>' ] );
		const clientNode = target.firstElementChild;

		// After the representation, a token is compared with the DOM rather
		// than with the last write.
		await runtime.act( () => {
			state.html = { wpServerHtml: true };
		} );
		await runtime.act( () => {
			state.html = runtime.asDangerousHTML(
				'<p><a href="/x">Link</a></p>'
			);
		} );
		expect( target.firstElementChild ).toBe( clientNode );
		expect( writes ).toHaveLength( 1 );

		await runtime.act( () => {
			state.html = { wpServerHtml: true };
		} );
		await runtime.act( () => {
			state.html = null;
		} );
		expect( target ).toBeEmptyDOMElement();

		await runtime.act( () => {
			state.html = { wpServerHtml: true };
		} );
		await runtime.act( () => {
			state.html = '<p>String</p>';
		} );
		expect( target ).toBeEmptyDOMElement();
		expect( console ).toHaveWarnedWith(
			'data-wp-html: the value is not trusted HTML. Use asDangerousHTML() to explicitly trust the markup.'
		);
	} );

	it( 'writes an accepted token after the server representation when the same HTML was rejected before', async () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', true );
		const runtime = await loadConflictRuntime();
		const html = '<b>x</b>';
		// A minimal stand-in for a native `TrustedHTML` value.
		const trustedValue = { toString: () => html, toJSON: () => html };
		vi.stubGlobal( 'trustedTypes', {
			isHTML: ( value: unknown ) => value === trustedValue,
		} );
		const namespace = uniqueNamespace();
		const { state } = runtime.store( namespace, {
			state: { html: runtime.asDangerousHTML( html ) as unknown },
		} );
		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html"><p>Server</p></div>'
		);
		const target = region.querySelector( 'div' )!;
		const descriptor = Object.getOwnPropertyDescriptor(
			Element.prototype,
			'innerHTML'
		)!;
		// Rejects non-empty strings, as a browser enforcing Trusted Types does.
		Object.defineProperty( target, 'innerHTML', {
			configurable: true,
			get: () => descriptor.get!.call( target ),
			set: ( value: unknown ) => {
				if ( typeof value === 'string' && value !== '' ) {
					throw new TypeError(
						'This document requires TrustedHTML.'
					);
				}
				descriptor.set!.call( target, value );
			},
		} );

		await runtime.act( () =>
			runtime.hydrate( runtime.toVdom( region ), region.parentNode! )
		);
		expect( target ).toBeEmptyDOMElement();
		expect( console ).toHaveWarnedWith(
			'data-wp-html: the browser rejected this HTML value, so the element was emptied. TypeError: This document requires TrustedHTML.'
		);

		await runtime.act( () => {
			state.html = { wpServerHtml: true };
		} );
		await runtime.act( () => {
			state.html = runtime.asDangerousHTML( trustedValue as never );
		} );
		expect( target.innerHTML ).toBe( html );
	} );

	it.each( [
		{ wpServerHtml: true, html: '<img src=x onerror=alert(1)>' },
		{ wpServerHtml: true, __html: '<b>x</b>' },
	] )(
		'keeps the content without rendering the markup in %j',
		async ( html ) => {
			vi.stubGlobal( 'SCRIPT_DEBUG', true );
			const runtime = await loadConflictRuntime();
			const namespace = uniqueNamespace();
			runtime.store( namespace, { state: { html } } );
			const region = createRegion(
				namespace,
				'<div data-wp-html="state.html"><p>Server</p></div>'
			);
			const warnings = vi.spyOn( console, 'warn' );
			await runtime.act( () =>
				runtime.hydrate( runtime.toVdom( region ), region.parentNode! )
			);
			expect( region.querySelector( 'div' )!.innerHTML ).toBe(
				'<p>Server</p>'
			);
			expect( warnings ).not.toHaveBeenCalled();
		}
	);

	it.each( [ {}, { wpServerHtml: 'true' }, { html: '<b>x</b>' } ] )(
		'empties the element for the object %j',
		async ( html ) => {
			vi.stubGlobal( 'SCRIPT_DEBUG', true );
			const runtime = await loadConflictRuntime();
			const namespace = uniqueNamespace();
			runtime.store( namespace, { state: { html } } );
			const region = createRegion(
				namespace,
				'<div data-wp-html="state.html"><p>Server</p></div>'
			);
			await runtime.act( () =>
				runtime.hydrate( runtime.toVdom( region ), region.parentNode! )
			);
			expect( region.querySelector( 'div' ) ).toBeEmptyDOMElement();
			expect( console ).toHaveWarnedWith(
				'data-wp-html: the value is not trusted HTML. Use asDangerousHTML() to explicitly trust the markup.'
			);
		}
	);

	it( 'renders trusted HTML from asDangerousHTML()', async () => {
		const namespace = uniqueNamespace();
		const { state } = store( namespace, {
			state: { html: asDangerousHTML( '<strong>Hi</strong>' ) },
		} );

		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html">fallback</div>'
		);
		await act( () => hydrate( toVdom( region ), region.parentNode! ) );

		const target = region.querySelector( 'div' )!;
		expect( target.innerHTML ).toBe( '<strong>Hi</strong>' );

		await act( () => {
			state.html = asDangerousHTML( '<em>Bye</em>' );
		} );
		expect( target.innerHTML ).toBe( '<em>Bye</em>' );
	} );

	it( 'keeps the server-rendered nodes when they match the trusted HTML on hydration', async () => {
		const html = '<p>Hi <strong>there</strong></p>';
		const namespace = uniqueNamespace();
		const { state } = store( namespace, {
			state: { html: asDangerousHTML( html ) },
		} );

		const region = createRegion(
			namespace,
			`<div data-wp-html="state.html">${ html }</div>`
		);
		const target = region.querySelector( 'div' )!;
		const serverNode = target.firstElementChild;
		const writes = recordHtmlWrites( target );

		await act( () => hydrate( toVdom( region ), region.parentNode! ) );
		expect( target.innerHTML ).toBe( html );
		expect( target.firstElementChild ).toBe( serverNode );
		expect( writes ).toEqual( [] );

		// A new token with the same HTML doesn't replace them either.
		await act( () => {
			state.html = asDangerousHTML( html );
		} );
		expect( target.firstElementChild ).toBe( serverNode );
		expect( writes ).toEqual( [] );

		// Different HTML still renders.
		await act( () => {
			state.html = asDangerousHTML( '<em>Bye</em>' );
		} );
		expect( target.innerHTML ).toBe( '<em>Bye</em>' );
	} );

	it( 'keeps the server-rendered nodes when they match a TrustedHTML value on hydration', async () => {
		const html = '<p>Trusted</p>';
		// A minimal stand-in for a native `TrustedHTML` value, which
		// stringifies to the HTML it holds.
		const trustedValue = { toString: () => html, toJSON: () => html };
		vi.stubGlobal( 'trustedTypes', {
			isHTML: ( value: unknown ) => value === trustedValue,
		} );

		const namespace = uniqueNamespace();
		store( namespace, {
			state: { html: asDangerousHTML( trustedValue as never ) },
		} );

		const region = createRegion(
			namespace,
			`<div data-wp-html="state.html">${ html }</div>`
		);
		const target = region.querySelector( 'div' )!;
		const serverNode = target.firstElementChild;
		const writes = recordHtmlWrites( target );

		await act( () => hydrate( toVdom( region ), region.parentNode! ) );
		expect( target.firstElementChild ).toBe( serverNode );
		expect( writes ).toEqual( [] );
	} );

	it( 'empties null content and writes matching HTML when a token resolves later', async () => {
		const namespace = uniqueNamespace();
		const { state } = store( namespace, {
			// HTML is unavailable until the later reactive update.
			state: {
				// The trusted value bound to the element.
				html: null as DangerousHTML | null,
			},
		} );
		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html"><p>Same</p></div>'
		);
		const target = region.querySelector( 'div' )!;
		const writes = recordHtmlWrites( target );
		const mutations: MutationRecord[] = [];
		const observer = new MutationObserver( ( records ) =>
			mutations.push( ...records )
		);
		observer.observe( target, { childList: true } );

		await act( () => hydrate( toVdom( region ), region.parentNode! ) );
		expect( writes ).toEqual( [ '' ] );
		expect( target ).toBeEmptyDOMElement();
		expect( mutations ).toHaveLength( 1 );
		await act( () => {
			state.html = asDangerousHTML( '<p>Same</p>' );
		} );
		expect( writes ).toEqual( [ '', '<p>Same</p>' ] );
		expect( mutations ).toHaveLength( 2 );
		expect( target.innerHTML ).toBe( '<p>Same</p>' );
		observer.disconnect();
	} );

	it.each( [ '<p>Same</p>', '<p>Client</p>' ] )(
		'writes only differing trusted HTML when a pending getter registers later: %s',
		async ( html ) => {
			const namespace = uniqueNamespace();
			populateServerData( {
				// Server state identifies the getter without its client implementation.
				state: { [ namespace ]: { html: {} } },
				// Marks HTML as a derived value pending store registration.
				derivedStateClosures: { [ namespace ]: [ 'state.html' ] },
			} );
			const region = createRegion(
				namespace,
				'<div data-wp-html="state.html"><p>Same</p></div>'
			);
			const target = region.querySelector( 'div' )!;
			const serverNode = target.firstElementChild;
			const writes = recordHtmlWrites( target );
			const mutations: MutationRecord[] = [];
			const observer = new MutationObserver( ( records ) =>
				mutations.push( ...records )
			);
			observer.observe( target, { childList: true } );
			const warnings = vi.spyOn( console, 'warn' );
			await act( () => hydrate( toVdom( region ), region.parentNode! ) );
			expect( writes ).toEqual( [] );
			expect( mutations ).toHaveLength( 0 );
			expect( target.firstElementChild ).toBe( serverNode );
			expect( warnings ).not.toHaveBeenCalled();

			// Reactive source populated by the late store registration.
			let state!: {
				// HTML source exposed by the registered store.
				markup: string;
			};
			await act( async () => {
				( { state } = store( namespace, {
					// Registers the previously pending getter and its reactive input.
					state: {
						// HTML source used to produce the trusted token.
						markup: html,
						/**
						 * Resolves the current markup as explicitly trusted HTML.
						 *
						 * @return The trusted HTML token.
						 */
						get html(): DangerousHTML {
							return asDangerousHTML( state.markup );
						},
					},
				} ) );
			} );
			expect( target.innerHTML ).toBe( html );
			const expectedWrites = html === '<p>Same</p>' ? [] : [ html ];
			expect( writes ).toEqual( expectedWrites );
			expect( mutations ).toHaveLength( expectedWrites.length );
			expect( target.firstElementChild === serverNode ).toBe(
				html === '<p>Same</p>'
			);

			await act( () => {
				state.markup = '<p>Other</p>';
			} );
			expect( writes ).toEqual( [ ...expectedWrites, '<p>Other</p>' ] );
			expect( target.innerHTML ).toBe( '<p>Other</p>' );
			expect( mutations ).toHaveLength( expectedWrites.length + 1 );
			observer.disconnect();
		}
	);

	it( 'shows pending fallback and follows resolved values in existing and added list items', async () => {
		const runtime = await loadConflictRuntime();
		const warnings = vi.spyOn( console, 'warn' );
		const namespace = uniqueNamespace();
		runtime.populateServerData( {
			state: { [ namespace ]: { html: {} } },
			derivedStateClosures: { [ namespace ]: [ 'state.html' ] },
		} );
		const { state } = runtime.store( namespace, {
			// Reactive list and HTML shared by all item elements.
			state: {
				// Items rendered from the template.
				list: [ 'a' ],
			},
		} );
		const region = createRegion(
			namespace,
			'<ul><template data-wp-each="state.list"><li><div data-wp-html="state.html"><i>loading</i></div></li></template></ul>'
		);
		await runtime.act( () =>
			runtime.hydrate( runtime.toVdom( region ), region.parentNode! )
		);
		expect( region.querySelectorAll( 'li' ) ).toHaveLength( 1 );
		expect( region.querySelector( 'li div' )!.innerHTML ).toBe(
			'<i>loading</i>'
		);

		await runtime.act( () => {
			state.list = [ 'a', 'b' ];
		} );
		expect(
			Array.from(
				region.querySelectorAll( 'li div' ),
				( item ) => item.innerHTML
			)
		).toEqual( [ '<i>loading</i>', '<i>loading</i>' ] );

		await runtime.act( async () => {
			runtime.store( namespace, {
				state: { html: runtime.asDangerousHTML( '<b>Ready</b>' ) },
			} );
		} );
		expect(
			Array.from(
				region.querySelectorAll( 'li div' ),
				( item ) => item.innerHTML
			)
		).toEqual( [ '<b>Ready</b>', '<b>Ready</b>' ] );

		await runtime.act( () => {
			state.list = [ 'a', 'b', 'c' ];
		} );
		expect(
			Array.from(
				region.querySelectorAll( 'li div' ),
				( item ) => item.innerHTML
			)
		).toEqual( [ '<b>Ready</b>', '<b>Ready</b>', '<b>Ready</b>' ] );
		await runtime.act( () => {
			runtime.store( namespace, { state: { html: null } } );
			state.list = [ 'a', 'b', 'c', 'd' ];
		} );
		expect(
			Array.from(
				region.querySelectorAll( 'li div' ),
				( item ) => item.innerHTML
			)
		).toEqual( [ '', '', '', '' ] );
		expect( warnings ).not.toHaveBeenCalled();
		await runtime.act( () => {
			runtime.store( namespace, { state: { html: '<b>x</b>' } } );
			state.list = [ 'a', 'b', 'c', 'd', 'e' ];
		} );
		expect(
			Array.from(
				region.querySelectorAll( 'li div' ),
				( item ) => item.innerHTML
			)
		).toEqual( [ '', '', '', '', '' ] );
		expect( warnings ).toHaveBeenCalledTimes( 1 );
		expect( console ).toHaveWarnedWith(
			expect.stringMatching( /not.*trusted HTML/ )
		);
	} );

	it( 'empties content and restores scope when a function value throws', async () => {
		const namespace = uniqueNamespace();
		const { state } = store( namespace, {
			// Reactive values used by the HTML element and its sibling.
			state: {
				// Controls whether the HTML function can return a token.
				fail: true,
				// Text rendered independently of the HTML function.
				label: 'Hello',
				/**
				 * Resolves trusted HTML, or throws while unavailable.
				 *
				 * @return The trusted HTML token.
				 */
				render(): DangerousHTML {
					if ( state.fail ) {
						throw new Error( 'HTML unavailable' );
					}
					return asDangerousHTML( '<b>ok</b>' );
				},
			},
		} );
		const region = createRegion(
			namespace,
			'<div data-wp-html="state.render"><p>fallback</p></div><span data-wp-text="state.label"></span>'
		);
		const target = region.querySelector( 'div' )!;
		const sibling = region.querySelector( 'span' )!;
		const warnings = vi.spyOn( console, 'warn' );
		const errors = vi.spyOn( console, 'error' );

		try {
			await act( () => hydrate( toVdom( region ), region.parentNode! ) );
			expect( target ).toBeEmptyDOMElement();
			expect( sibling ).toHaveTextContent( /^Hello$/ );
			expect( getScope() ).toBeUndefined();

			await act( () => {
				state.fail = false;
				state.label = 'Ready';
			} );
			expect( target.innerHTML ).toBe( '<b>ok</b>' );
			expect( sibling ).toHaveTextContent( /^Ready$/ );
			expect( getScope() ).toBeUndefined();

			await act( () => {
				state.fail = true;
				state.label = 'Unavailable';
			} );
			expect( target ).toBeEmptyDOMElement();
			expect( sibling ).toHaveTextContent( /^Unavailable$/ );
			expect( getScope() ).toBeUndefined();
			expect( warnings ).not.toHaveBeenCalled();
			expect( errors ).not.toHaveBeenCalled();
		} finally {
			// Keep a regression's leaked frames from affecting other tests.
			while ( getScope() ) {
				resetScope();
			}
		}
	} );

	it( 'ignores suffixed and unique-ID variants', async () => {
		const runtime = await loadConflictRuntime();
		const namespace = uniqueNamespace();
		const { state } = runtime.store( namespace, {
			state: {
				/** Value ignored by unsupported directive spellings. */
				html: runtime.asDangerousHTML(
					'<strong>Hi</strong>'
				) as unknown,
			},
		} );

		const region = createRegion(
			namespace,
			'<div data-wp-html--suffix="state.html"><p>a</p></div>' +
				'<div data-wp-html---unique-id="state.html"><p>b</p></div>'
		);
		await runtime.act( () =>
			runtime.hydrate( runtime.toVdom( region ), region.parentNode! )
		);

		const [ suffixed, uniqueId ] = region.querySelectorAll( 'div' );
		expect( suffixed.innerHTML ).toBe( '<p>a</p>' );
		expect( uniqueId.innerHTML ).toBe( '<p>b</p>' );
		expect( console ).toHaveWarned();
		for ( const value of [ null, '<b>x</b>', undefined ] ) {
			await runtime.act( () => {
				state.html = value;
			} );
			expect( suffixed.innerHTML ).toBe( '<p>a</p>' );
			expect( uniqueId.innerHTML ).toBe( '<p>b</p>' );
		}
	} );

	it.each( [ true, false ] )(
		'empties rejected HTML and suppresses retries (at hydration: %s)',
		async ( atHydration ) => {
			const runtime = await loadConflictRuntime();
			const namespace = uniqueNamespace();
			const { state } = runtime.store( namespace, {
				state: {
					/** Current token, including a selectively rejected value. */
					html: runtime.asDangerousHTML(
						atHydration ? '<b>bad</b>' : '<b>a</b>'
					),
				},
			} );

			const region = createRegion(
				namespace,
				'<div data-wp-html="state.html"><p>fallback</p></div>'
			);
			const target = region.querySelector( 'div' )!;

			const descriptor = Object.getOwnPropertyDescriptor(
				Element.prototype,
				'innerHTML'
			)!;
			const writes: string[] = [];
			const warnings = vi.spyOn( console, 'warn' );
			Object.defineProperty( target, 'innerHTML', {
				/** Allows the accessor to be discarded with the element. */
				configurable: true,
				/** Serializes the native element's current content. */
				get: () => descriptor.get!.call( target ),
				/**
				 * Records assignments while rejecting only the selected token.
				 *
				 * @param value HTML assigned to the element.
				 */
				set: ( value: string ) => {
					writes.push( value );
					if ( value === '<b>bad</b>' ) {
						throw new TypeError( 'rejected' );
					}
					descriptor.set!.call( target, value );
				},
			} );

			await runtime.act( () =>
				runtime.hydrate( runtime.toVdom( region ), region.parentNode! )
			);
			expect( target.innerHTML ).toBe( atHydration ? '' : '<b>a</b>' );
			if ( ! atHydration ) {
				await runtime.act( () => {
					state.html = runtime.asDangerousHTML( '<b>bad</b>' );
				} );
			}
			expect( target ).toBeEmptyDOMElement();
			expect( writes ).toEqual(
				atHydration
					? [ '<b>bad</b>', '' ]
					: [ '<b>a</b>', '<b>bad</b>', '' ]
			);
			const count = warnings.mock.calls.length;
			expect( count ).toBe( 1 );
			expect( console ).toHaveWarnedWith(
				expect.stringMatching( /browser rejected.*emptied/ )
			);
			await runtime.act( () => {
				state.html = runtime.asDangerousHTML( '<b>bad</b>' );
			} );
			expect(
				writes.filter( ( value ) => value === '<b>bad</b>' )
			).toHaveLength( 1 );
			expect( warnings.mock.calls ).toHaveLength( count );
			await runtime.act( () => {
				state.html = runtime.asDangerousHTML( '<b>c</b>' );
			} );
			expect( target.innerHTML ).toBe( '<b>c</b>' );
		}
	);
} );

/**
 * Loads an isolated runtime so each test can observe deduplicated warnings.
 * Its renderer hook is restored by the file's afterEach cleanup.
 *
 * @return The directive runtime and its matching Preact renderer.
 */
async function loadConflictRuntime() {
	vi.resetModules();
	await import( '../index' );
	const { toVdom: convert } = await import( '../../vdom' );
	const { store: register, populateServerData: populate } =
		await import( '../../store' );
	const { asDangerousHTML: token } = await import( '../../html' );
	const { getContext: readContext } = await import( '../../scopes' );
	const { hydrate: hydrateRegion } = await import( 'preact' );
	const { act: flush } = await import( 'preact/test-utils' );
	return {
		// Converts the test markup using this runtime's directive registry.
		toVdom: convert,
		// Registers and updates this runtime's reactive state.
		store: register,
		// Initializes pending getters from server-provided state.
		populateServerData: populate,
		// Creates tokens recognized by this runtime's HTML directive.
		asDangerousHTML: token,
		// Reads the context of this runtime's current scope.
		getContext: readContext,
		// Hydrates markup with the matching Preact instance.
		hydrate: hydrateRegion,
		// Flushes reactive updates with the matching Preact instance.
		act: flush,
	};
}

describe( 'data-wp-html conflicts', () => {
	/** Captures the full warning sequence for the current test. */
	let conflictWarningSpy: MockInstance< typeof console.warn >;

	beforeEach( () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', true );
		conflictWarningSpy = vi.spyOn( console, 'warn' );
	} );

	/**
	 * Asserts the complete warning sequence and accounts for expected console calls.
	 *
	 * @param messages Expected messages, including duplicates, in emission order.
	 */
	function expectConflictWarnings( messages: string[] ): void {
		expect( conflictWarningSpy.mock.calls ).toEqual(
			messages.map( ( message ) => [ message ] )
		);
		for ( const message of messages ) {
			expect( console ).toHaveWarnedWith( message );
		}
	}

	it.each( [
		[ true, true ],
		[ true, false ],
		[ false, true ],
	] )(
		'yields to text and its updates (debug: %s, HTML first: %s)',
		async ( debug, htmlFirst ) => {
			vi.stubGlobal( 'SCRIPT_DEBUG', debug );
			const {
				store: register,
				asDangerousHTML: token,
				act: flush,
				hydrate: hydrateRegion,
				toVdom: convert,
			} = await loadConflictRuntime();
			const namespace = uniqueNamespace();
			const { state } = register( namespace, {
				state: { html: token( '<b>x</b>' ), text: 'Hello' },
			} );
			const attributes = [
				'data-wp-html="state.html"',
				'data-wp-text="state.text"',
			];
			if ( ! htmlFirst ) {
				attributes.reverse();
			}
			const region = createRegion(
				namespace,
				`<div ${ attributes.join( ' ' ) }>fallback</div><div data-wp-text="state.text">fallback</div>`
			);
			await flush( () =>
				hydrateRegion( convert( region ), region.parentNode! )
			);
			const [ target, baseline ] = region.querySelectorAll( 'div' );
			expect( target ).toHaveTextContent( /^Hello$/ );
			expect( target.innerHTML ).toBe( baseline.innerHTML );
			expect( target.querySelector( 'b' ) ).toBeNull();
			await flush( () => {
				state.text = 'Bye';
			} );
			expect( target ).toHaveTextContent( /^Bye$/ );
			expect( target.innerHTML ).toBe( baseline.innerHTML );
			expect( target.querySelector( 'b' ) ).toBeNull();
			expectConflictWarnings(
				debug
					? [
							'The data-wp-html directive was ignored because it conflicts with data-wp-text.',
						]
					: []
			);
		}
	);

	it.each( [ true, false ] )(
		'yields to data-wp-each and list growth (HTML first: %s)',
		async ( htmlFirst ) => {
			const each = 'data-wp-each';
			const {
				store: register,
				asDangerousHTML: token,
				act: flush,
				hydrate: hydrateRegion,
				toVdom: convert,
			} = await loadConflictRuntime();
			const namespace = uniqueNamespace();
			const { state } = register( namespace, {
				state: { html: token( '<b>x</b>' ), list: [ 'a', 'b' ] },
			} );
			const attributes = [
				'data-wp-html="state.html"',
				`${ each }="state.list"`,
			];
			if ( ! htmlFirst ) {
				attributes.reverse();
			}
			const child = '<li data-wp-text="context.item"></li>';
			const region = createRegion(
				namespace,
				`<ul><template ${ attributes.join( ' ' ) }>${ child }</template></ul><ul><template ${ each }="state.list">${ child }</template></ul>`
			);
			await flush( () =>
				hydrateRegion( convert( region ), region.parentNode! )
			);
			const [ target, baseline ] = region.querySelectorAll( 'ul' );
			expect( target.querySelectorAll( 'li' ) ).toHaveLength( 2 );
			expect(
				Array.from(
					target.querySelectorAll( 'li' ),
					( li ) => li.innerHTML
				)
			).toEqual(
				Array.from(
					baseline.querySelectorAll( 'li' ),
					( li ) => li.innerHTML
				)
			);
			await flush( () => {
				state.list = [ 'a', 'b', 'c' ];
			} );
			const texts = Array.from(
				target.querySelectorAll( 'li' ),
				( li ) => li.textContent
			);
			expect( texts ).toEqual( [ 'a', 'b', 'c' ] );
			expect( texts ).toEqual(
				Array.from(
					baseline.querySelectorAll( 'li' ),
					( li ) => li.textContent
				)
			);
			expect( region.querySelector( 'b' ) ).toBeNull();
			expectConflictWarnings( [
				'The data-wp-html directive was ignored because it conflicts with data-wp-each.',
			] );
		}
	);

	it( 'yields to router-region and processes descendants', async () => {
		const {
			store: register,
			asDangerousHTML: token,
			act: flush,
			hydrate: hydrateRegion,
			toVdom: convert,
		} = await loadConflictRuntime();
		const namespace = uniqueNamespace();
		const { state } = register( namespace, {
			state: { html: token( '<b>x</b>' ), text: 'Hello' },
		} );
		const attributes = [
			'data-wp-html="state.html"',
			`data-wp-router-region="${ namespace }/target"`,
		];
		const child = '<span data-wp-text="state.text">fallback</span>';
		const region = createRegion(
			namespace,
			`<div ${ attributes.join( ' ' ) }>${ child }</div><div data-wp-router-region="${ namespace }/baseline">${ child }</div>`
		);
		await flush( () =>
			hydrateRegion( convert( region ), region.parentNode! )
		);
		const [ target, baseline ] = region.querySelectorAll( 'div' );
		expect( target.innerHTML ).toBe( baseline.innerHTML );
		expect( target ).toHaveTextContent( /^Hello$/ );
		await flush( () => {
			state.text = 'Bye';
		} );
		expect( target.innerHTML ).toBe( baseline.innerHTML );
		expect( target ).toHaveTextContent( /^Bye$/ );
		expect( target.querySelector( 'b' ) ).toBeNull();
		expectConflictWarnings( [
			'The data-wp-html directive was ignored because it conflicts with data-wp-router-region.',
		] );
	} );

	it.each(
		[ 'data-wp-text--x="state.text"', 'data-wp-each="state.list"' ].flatMap(
			( conflict ) =>
				[ true, false ].map(
					( trusted ) => [ conflict, trusted ] as const
				)
		)
	)(
		'preserves the content and warnings of %s on a div (trusted: %s)',
		async ( conflict, trusted ) => {
			const warnings = vi.spyOn( console, 'warn' );
			const outputs: string[] = [];
			const calls: unknown[][][] = [];
			for ( const html of [ '', 'data-wp-html="state.html"' ] ) {
				const {
					store: register,
					asDangerousHTML: token,
					act: flush,
					hydrate: hydrateRegion,
					toVdom: convert,
				} = await loadConflictRuntime();
				const namespace = uniqueNamespace();
				register( namespace, {
					state: {
						html: trusted ? token( '<b>x</b>' ) : null,
						text: 'Hello',
						list: [ 'a' ],
					},
				} );
				const region = createRegion(
					namespace,
					`<div ${ html } ${ conflict }><i>fallback</i><span data-wp-text="state.text"></span></div>`
				);
				const start = warnings.mock.calls.length;
				await flush( () =>
					hydrateRegion( convert( region ), region.parentNode! )
				);
				const target = region.querySelector( 'div' )!;
				outputs.push( target.innerHTML );
				expect( target.querySelector( 'b' ) ).toBeNull();
				calls.push( warnings.mock.calls.slice( start ) );
			}
			expect( outputs[ 1 ] ).toBe( outputs[ 0 ] );
			const prefix = conflict.startsWith( 'data-wp-text' )
				? 'text'
				: 'each';
			const ownWarning =
				prefix === 'text'
					? 'The usage of data-wp-text--suffix is not supported. Please use data-wp-text instead.'
					: 'The data-wp-each directive can only be used on <template> elements.';
			const conflictWarning = `The data-wp-html directive was ignored because it conflicts with data-wp-${ prefix }.`;
			expect( calls ).toEqual( [
				[ [ ownWarning ] ],
				[ [ conflictWarning ], [ ownWarning ] ],
			] );
			expectConflictWarnings( [
				ownWarning,
				conflictWarning,
				ownWarning,
			] );
		}
	);

	it( 'names every conflicting directive in fixed warning order', async () => {
		const { toVdom: convert } = await loadConflictRuntime();
		const region = createRegion(
			uniqueNamespace(),
			'<div data-wp-router-region="r" data-wp-each="state.list" data-wp-text="state.text" data-wp-html="state.html">fallback</div>'
		);
		convert( region );
		expect( console ).toHaveWarnedWith(
			'The data-wp-html directive was ignored because it conflicts with data-wp-text, data-wp-each, data-wp-router-region.'
		);
	} );

	it.each(
		[ 'text', 'each', 'router-region' ].flatMap( ( prefix ) => [
			[ prefix, '--suffix', true ] as const,
			[ prefix, '---id', true ] as const,
			[ prefix, '', false ] as const,
		] )
	)(
		'yields every HTML entry to %s%s with only a conflict warning (default HTML: %s)',
		async ( prefix, suffix, defaultHtml ) => {
			const runtime = await loadConflictRuntime();
			const namespace = uniqueNamespace();
			const { state } = runtime.store( namespace, {
				state: {
					html: runtime.asDangerousHTML( '<b>x</b>' ),
					text: 'Hello',
					list: [ 'a', 'b' ],
				},
			} );
			const html = [
				'data-wp-html--suffix="state.html"',
				'data-wp-html--suffix---id="state.html"',
			];
			if ( defaultHtml ) {
				html.push(
					'data-wp-html="state.html"',
					'data-wp-html--="state.html"',
					'data-wp-html---="state.html"',
					'data-wp-html---id="state.html"'
				);
			}
			const reference = prefix === 'each' ? 'state.list' : 'state.text';
			const conflict = `data-wp-${ prefix }${ suffix }="${ reference }"`;
			const attributes = [ ...html, conflict ];
			const tag = prefix === 'each' ? 'template' : 'div';
			const child = '<span data-wp-text="state.text">fallback</span>';
			const target = createRegion(
				namespace,
				`<${ tag } ${ attributes.join( ' ' ) }>${ child }</${ tag }>`
			);
			const baseline = createRegion(
				namespace,
				`<${ tag } ${ conflict }>${ child }</${ tag }>`
			);
			await runtime.act( () => {
				runtime.hydrate( runtime.toVdom( target ), target.parentNode! );
				runtime.hydrate(
					runtime.toVdom( baseline ),
					baseline.parentNode!
				);
			} );
			/**
			 * Serializes rendered content without inert HTML attributes.
			 *
			 * @return Markup comparable to the element without HTML directives.
			 */
			const withoutHtmlAttributes = () =>
				target.innerHTML.replace( / data-wp-html[^=]*="[^"]*"/g, '' );
			expect( withoutHtmlAttributes() ).toBe( baseline.innerHTML );
			expect( target.querySelector( 'b' ) ).toBeNull();
			await runtime.act( () => {
				state.text = 'Bye';
				state.list = [ 'a', 'b', 'c' ];
			} );
			expect( withoutHtmlAttributes() ).toBe( baseline.innerHTML );
			expect( target.querySelector( 'b' ) ).toBeNull();
			const conflictWarning = `The data-wp-html directive was ignored because it conflicts with data-wp-${ prefix }.`;
			expect(
				conflictWarningSpy.mock.calls.filter( ( [ message ] ) =>
					message.includes( 'data-wp-html' )
				)
			).toEqual( [ [ conflictWarning ] ] );
			expect( console ).toHaveWarnedWith( conflictWarning );
			// Account for other directives' warnings without pinning their messages.
			expect( console ).toHaveWarned();
		}
	);
} );

describe( 'data-wp-html value contract', () => {
	it.each(
		[ true, false ].flatMap( ( debug ) =>
			[
				'null',
				'undefined',
				'missing',
				'getter',
				'function',
				'<b>x</b>',
				'',
				42,
				true,
				{},
			].map( ( value ) => [ debug, value ] as const )
		)
	)(
		'empties resolved non-tokens (debug: %s, value: %s)',
		async ( debug, value ) => {
			vi.stubGlobal( 'SCRIPT_DEBUG', debug );
			const runtime = await loadConflictRuntime();
			const namespace = uniqueNamespace();
			const silent = [
				'null',
				'undefined',
				'missing',
				'getter',
				'function',
			].includes( value as string );
			let source: unknown = value;
			if ( value === 'null' ) {
				source = null;
			}
			if ( value === 'undefined' ) {
				source = undefined;
			}
			const definition = { html: source };
			if ( value === 'getter' ) {
				Object.defineProperty( definition, 'html', {
					/** Makes the derived value visible to the store registry. */
					enumerable: true,
					/** Throws to simulate an unavailable derived value. */
					get() {
						throw new Error( 'unavailable' );
					},
				} );
			} else if ( value === 'function' ) {
				Object.assign( definition, {
					/** Throws to simulate an unavailable function value. */
					html() {
						throw new Error( 'unavailable' );
					},
				} );
			}
			runtime.store( namespace, { state: definition } );
			const region = createRegion(
				namespace,
				`<div data-wp-html="state.${ value === 'missing' ? 'missing' : 'html' }"><p>fallback</p></div>`
			);
			const warnings = vi.spyOn( console, 'warn' );
			await runtime.act( () =>
				runtime.hydrate( runtime.toVdom( region ), region.parentNode! )
			);
			expect( region.querySelector( 'div' )! ).toBeEmptyDOMElement();
			expect( region.querySelector( 'b' ) ).toBeNull();
			const expectedWarnings =
				debug && ! silent
					? [
							'data-wp-html: the value is not trusted HTML. Use asDangerousHTML() to explicitly trust the markup.',
						]
					: [];
			expect( warnings.mock.calls ).toEqual(
				expectedWarnings.map( ( message ) => [ message ] )
			);
			for ( const message of expectedWarnings ) {
				expect( console ).toHaveWarnedWith( message );
			}
		}
	);

	it( 'renders the current value and reapplies HTML after each removal', async () => {
		const runtime = await loadConflictRuntime();
		const namespace = uniqueNamespace();
		const { state } = runtime.store( namespace, {
			state: { html: runtime.asDangerousHTML( '<b>a</b>' ) as unknown },
		} );
		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html"><p>fallback</p></div>'
		);
		const warnings = vi.spyOn( console, 'warn' );
		await runtime.act( () =>
			runtime.hydrate( runtime.toVdom( region ), region.parentNode! )
		);
		const target = region.querySelector( 'div' )!;
		expect( target.innerHTML ).toBe( '<b>a</b>' );
		for ( const [ value, expected, warningCount ] of [
			[ null, '', 0 ],
			[ runtime.asDangerousHTML( '<b>b</b>' ), '<b>b</b>', 0 ],
			[ '<i>s</i>', '', 1 ],
			[ runtime.asDangerousHTML( '<b>b</b>' ), '<b>b</b>', 1 ],
		] ) {
			await runtime.act( () => {
				state.html = value;
			} );
			expect( target.innerHTML ).toBe( expected );
			expect( warnings.mock.calls ).toHaveLength(
				warningCount as number
			);
		}
		expect( console ).toHaveWarnedWith(
			expect.stringMatching( /not.*trusted HTML/ )
		);
	} );

	it.each( [ true, false ] )(
		'uses the empty HTML value for hydrated and created removals (Trusted Types: %s)',
		async ( native ) => {
			const empty = { toString: () => '', toJSON: () => '' };
			if ( native ) {
				vi.stubGlobal( 'trustedTypes', { emptyHTML: empty } );
			}
			const runtime = await loadConflictRuntime();
			const namespace = uniqueNamespace();
			const { state } = runtime.store( namespace, {
				state: { html: null as unknown, list: [ 'a' ] },
			} );
			const region = createRegion(
				namespace,
				'<div data-wp-html="state.html"><p>fallback</p></div><ul><template data-wp-each="state.list"><li data-wp-html="state.html"></li></template></ul>'
			);
			const descriptor = Object.getOwnPropertyDescriptor(
				Element.prototype,
				'innerHTML'
			)!;
			const values: unknown[] = [];
			const setter = vi
				.spyOn( Element.prototype, 'innerHTML', 'set' )
				.mockImplementation( function ( this: Element, value ) {
					values.push( value );
					descriptor.set!.call( this, value );
				} );
			await runtime.act( () =>
				runtime.hydrate( runtime.toVdom( region ), region.parentNode! )
			);
			expect( region.querySelector( 'li' ) ).not.toBeNull();
			expect( values.length ).toBeGreaterThanOrEqual( 2 );
			expect(
				values.every( ( value ) => value === ( native ? empty : '' ) )
			).toBe( true );
			await runtime.act( () => {
				state.html = runtime.asDangerousHTML( '<b>a</b>' );
			} );
			values.length = 0;
			await runtime.act( () => {
				state.html = null;
				state.list = [ 'a', 'b' ];
			} );
			expect( values.length ).toBeGreaterThanOrEqual( 3 );
			expect(
				values.every( ( value ) => value === ( native ? empty : '' ) )
			).toBe( true );
			setter.mockRestore();
		}
	);
} );
