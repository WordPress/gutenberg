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
import { hydratedIslands, toVdom } from '../../vdom';
import { store } from '../../store';
import { asDangerousHTML, type DangerousHTML } from '../../html';
import { getScope, resetScope } from '../../scopes';

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

describe( 'data-wp-html', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
		// @ts-expect-error `_values` is an internal property, accessed here for testing.
		hydratedIslands._values = new WeakMap();
	} );

	afterEach( () => {
		vi.unstubAllGlobals();
	} );

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

	it( 'leaves server-rendered content in place while the value is not trusted HTML yet', async () => {
		const namespace = uniqueNamespace();
		store( namespace, { state: { html: null } } );

		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html"><p>Loading…</p></div>'
		);
		await act( () => hydrate( toVdom( region ), region.parentNode! ) );

		const target = region.querySelector( 'div' )!;
		expect( target.innerHTML ).toBe( '<p>Loading…</p>' );
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

		await act( () => hydrate( toVdom( region ), region.parentNode! ) );
		expect( target.innerHTML ).toBe( html );
		expect( target.firstElementChild ).toBe( serverNode );

		// A new token with the same HTML doesn't replace them either.
		await act( () => {
			state.html = asDangerousHTML( html );
		} );
		expect( target.firstElementChild ).toBe( serverNode );

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

		await act( () => hydrate( toVdom( region ), region.parentNode! ) );
		expect( target.firstElementChild ).toBe( serverNode );
	} );

	it( 'does not render a plain string as HTML', async () => {
		const namespace = uniqueNamespace();
		store( namespace, { state: { html: '<strong>Not safe</strong>' } } );

		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html"><p>fallback</p></div>'
		);
		await act( () => hydrate( toVdom( region ), region.parentNode! ) );

		const target = region.querySelector( 'div' )!;
		expect( target.innerHTML ).toBe( '<p>fallback</p>' );
	} );

	it( 'keeps the last rendered HTML when the value later becomes untrusted', async () => {
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

		// A later value that resolves to `null` must not wipe the HTML that
		// was already rendered — the directive should keep showing the last
		// trusted HTML it received.
		await act( () => {
			// @ts-expect-error Testing an invalid runtime value on purpose.
			state.html = null;
		} );
		expect( target.innerHTML ).toBe( '<strong>Hi</strong>' );
	} );

	it( 'keeps the existing content when a getter throws from asDangerousHTML()', async () => {
		const namespace = uniqueNamespace();
		const { state } = store( namespace, {
			state: {
				isValid: false,
				get html(): DangerousHTML {
					return asDangerousHTML(
						( state.isValid
							? '<strong>Hi</strong>'
							: null ) as string
					);
				},
			},
		} );

		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html"><p>fallback</p></div>'
		);
		await act( () => hydrate( toVdom( region ), region.parentNode! ) );

		const target = region.querySelector( 'div' )!;
		expect( target.innerHTML ).toBe( '<p>fallback</p>' );

		await act( () => {
			state.isValid = true;
		} );
		expect( target.innerHTML ).toBe( '<strong>Hi</strong>' );

		await act( () => {
			state.isValid = false;
		} );
		expect( target.innerHTML ).toBe( '<strong>Hi</strong>' );
	} );

	it( 'keeps content and restores scope when a function value throws', async () => {
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
			expect( target.innerHTML ).toBe( '<p>fallback</p>' );
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
			expect( target.innerHTML ).toBe( '<b>ok</b>' );
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
		const namespace = uniqueNamespace();
		store( namespace, {
			state: { html: asDangerousHTML( '<strong>Hi</strong>' ) },
		} );

		const region = createRegion(
			namespace,
			'<div data-wp-html--suffix="state.html"><p>a</p></div>' +
				'<div data-wp-html---unique-id="state.html"><p>b</p></div>'
		);
		await act( () => hydrate( toVdom( region ), region.parentNode! ) );

		const [ suffixed, uniqueId ] = region.querySelectorAll( 'div' );
		expect( suffixed.innerHTML ).toBe( '<p>a</p>' );
		expect( uniqueId.innerHTML ).toBe( '<p>b</p>' );
		expect( console ).toHaveWarned();
	} );

	it( 'warns and preserves existing content when the browser rejects the HTML value', async () => {
		const namespace = uniqueNamespace();
		store( namespace, {
			state: { html: asDangerousHTML( '<strong>Hi</strong>' ) },
		} );

		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html"><p>fallback</p></div>'
		);
		const target = region.querySelector( 'div' )!;

		// Simulate a Trusted Types rejection: the site enforces Trusted Types
		// with no default policy, so the native setter throws for a plain
		// string. Hydration reuses this exact node, so overriding its
		// `innerHTML` accessor here intercepts the directive's own write.
		Object.defineProperty( target, 'innerHTML', {
			configurable: true,
			get: () => '<p>fallback</p>',
			set: () => {
				throw new TypeError(
					"Failed to set the 'innerHTML' property: This document requires 'TrustedHTML' assignment."
				);
			},
		} );

		await act( () => hydrate( toVdom( region ), region.parentNode! ) );

		expect( target.innerHTML ).toBe( '<p>fallback</p>' );
		expect( console ).toHaveWarned();
	} );

	it( 'does not retry a value the browser already rejected once', async () => {
		const namespace = uniqueNamespace();
		const { state } = store( namespace, {
			state: { html: asDangerousHTML( '<strong>Hi</strong>' ) },
		} );

		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html"><p>fallback</p></div>'
		);
		const target = region.querySelector( 'div' )!;

		let attempts = 0;
		Object.defineProperty( target, 'innerHTML', {
			configurable: true,
			get: () => '<p>fallback</p>',
			set: () => {
				attempts++;
				throw new TypeError( 'rejected' );
			},
		} );

		await act( () => hydrate( toVdom( region ), region.parentNode! ) );
		expect( attempts ).toBe( 1 );
		expect( console ).toHaveWarned();

		// Forcing an unrelated re-render must not retry the same value.
		await act( () => {
			state.html = asDangerousHTML( '<strong>Hi</strong>' );
		} );
		expect( attempts ).toBe( 1 );
	} );
} );

/**
 * Loads an isolated runtime so each test can observe deduplicated warnings.
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
		// Hydrates markup with the matching Preact instance.
		hydrate: hydrateRegion,
		// Flushes reactive updates with the matching Preact instance.
		act: flush,
	};
}

describe( 'data-wp-html conflicts', () => {
	/** Captures the full warning sequence for the current test. */
	let conflictWarningSpy: MockInstance< typeof console.warn >;
	/** Preserves the renderer's directive registry between isolated runtimes. */
	let originalVNodeHook: typeof options.vnode;

	beforeEach( () => {
		document.body.innerHTML = '';
		conflictWarningSpy = vi.spyOn( console, 'warn' );
		originalVNodeHook = options.vnode;
	} );

	afterEach( () => {
		options.vnode = originalVNodeHook;
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

	it.each(
		[ true, false ].flatMap( ( debug ) =>
			[ true, false ].map( ( htmlFirst ) => [ debug, htmlFirst ] )
		)
	)(
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

	it.each(
		[ 'data-wp-each', 'data-wp-each----' ].flatMap( ( each ) =>
			[ true, false ].flatMap( ( debug ) =>
				[ true, false ].map(
					( htmlFirst ) => [ each, debug, htmlFirst ] as const
				)
			)
		)
	)(
		'yields to %s and list growth (debug: %s, HTML first: %s)',
		async ( each, debug, htmlFirst ) => {
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
			expect( texts ).toEqual(
				each === 'data-wp-each' ? [ 'a', 'b', 'c' ] : [ '', '', '' ]
			);
			expect( texts ).toEqual(
				Array.from(
					baseline.querySelectorAll( 'li' ),
					( li ) => li.textContent
				)
			);
			expect( region.querySelector( 'b' ) ).toBeNull();
			expectConflictWarnings(
				debug
					? [
							'The data-wp-html directive was ignored because it conflicts with data-wp-each.',
						]
					: []
			);
		}
	);

	it.each(
		[ true, false ].flatMap( ( debug ) =>
			[ true, false ].map( ( htmlFirst ) => [ debug, htmlFirst ] )
		)
	)(
		'yields to router-region and processes descendants (debug: %s, HTML first: %s)',
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
				`data-wp-router-region="${ namespace }/target"`,
			];
			if ( ! htmlFirst ) {
				attributes.reverse();
			}
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
			expectConflictWarnings(
				debug
					? [
							'The data-wp-html directive was ignored because it conflicts with data-wp-router-region.',
						]
					: []
			);
		}
	);

	it.each(
		[ 'data-wp-text--x="state.text"', 'data-wp-each="state.list"' ].flatMap(
			( conflict ) =>
				[ true, false ].flatMap( ( debug ) =>
					[ true, false ].map(
						( htmlFirst ) => [ conflict, debug, htmlFirst ] as const
					)
				)
		)
	)(
		'preserves the content and warnings of %s on a div (debug: %s, HTML first: %s)',
		async ( conflict, debug, htmlFirst ) => {
			vi.stubGlobal( 'SCRIPT_DEBUG', debug );
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
						html: token( '<b>x</b>' ),
						text: 'Hello',
						list: [ 'a' ],
					},
				} );
				const attributes = htmlFirst
					? `${ html } ${ conflict }`
					: `${ conflict } ${ html }`;
				const region = createRegion(
					namespace,
					`<div ${ attributes }><i>fallback</i><span data-wp-text="state.text"></span></div>`
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
			expect( calls ).toEqual(
				debug
					? [
							[ [ ownWarning ] ],
							[ [ conflictWarning ], [ ownWarning ] ],
						]
					: [ [], [] ]
			);
			expectConflictWarnings(
				debug ? [ ownWarning, conflictWarning, ownWarning ] : []
			);
		}
	);

	it.each(
		[
			[ 'html', 'text', 'each' ],
			[ 'html', 'each', 'text' ],
			[ 'text', 'html', 'each' ],
			[ 'text', 'each', 'html' ],
			[ 'each', 'html', 'text' ],
			[ 'each', 'text', 'html' ],
		].flatMap( ( order ) =>
			[ true, false ].map( ( debug ) => [ order, debug ] as const )
		)
	)(
		'preserves text/each template behavior in order %s (debug: %s)',
		async ( order, debug ) => {
			vi.stubGlobal( 'SCRIPT_DEBUG', debug );
			const {
				store: register,
				populateServerData: populate,
				asDangerousHTML: token,
				act: flush,
				hydrate: hydrateRegion,
				toVdom: convert,
			} = await loadConflictRuntime();
			const namespace = uniqueNamespace();
			populate( {
				state: { [ namespace ]: { list: {} } },
				derivedStateClosures: { [ namespace ]: [ 'state.list' ] },
			} );
			register( namespace, {
				state: { html: token( '<b>x</b>' ), text: 'Hello' },
			} );
			const attributes = order.map(
				( prefix ) =>
					`data-wp-${ prefix }="state.${ prefix === 'each' ? 'list' : prefix }"`
			);
			const child = '<li data-wp-text="context.item"></li>';
			const region = createRegion(
				namespace,
				`<ul><template ${ attributes.join( ' ' ) }>${ child }</template></ul><ul><template ${ attributes.filter( ( attribute ) => ! attribute.startsWith( 'data-wp-html' ) ).join( ' ' ) }>${ child }</template></ul>`
			);
			await flush( () =>
				hydrateRegion( convert( region ), region.parentNode! )
			);
			const [ target, baseline ] = region.querySelectorAll( 'ul' );
			// The inert attribute remains in the markup; compare content without it.
			expect(
				target.innerHTML.replace( ' data-wp-html="state.html"', '' )
			).toBe( baseline.innerHTML );
			// Store getter registration consolidates in a microtask; use async act.
			await flush( async () => {
				register( namespace, {
					state: {
						get list() {
							return [ 'a' ];
						},
					},
				} );
			} );
			expect(
				target.innerHTML.replace( ' data-wp-html="state.html"', '' )
			).toBe( baseline.innerHTML );
			expect( target.querySelectorAll( 'li' ) ).toHaveLength( 1 );
			await flush( () => {
				register( namespace, { state: { list: 42 } } );
			} );
			expect(
				target.innerHTML.replace( ' data-wp-html="state.html"', '' )
			).toBe( baseline.innerHTML );
			expect( region.querySelector( 'b' ) ).toBeNull();
			expectConflictWarnings(
				debug
					? [
							'The data-wp-html directive was ignored because it conflicts with data-wp-text, data-wp-each.',
						]
					: []
			);
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

	it( 'keeps the suffixed HTML warning when a default HTML entry yields', async () => {
		const {
			store: register,
			asDangerousHTML: token,
			act: flush,
			hydrate: hydrateRegion,
			toVdom: convert,
		} = await loadConflictRuntime();
		const namespace = uniqueNamespace();
		register( namespace, {
			state: { html: token( '<b>x</b>' ), text: 'Hello' },
		} );
		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html" data-wp-html--suffix="state.html" data-wp-text="state.text">fallback</div>'
		);
		await flush( () =>
			hydrateRegion( convert( region ), region.parentNode! )
		);
		expect( region ).toHaveTextContent( /^Hello$/ );
		expectConflictWarnings( [
			'The data-wp-html directive was ignored because it conflicts with data-wp-text.',
			'The usage of data-wp-html--suffix is not supported. Please use data-wp-html instead.',
		] );
	} );
} );
