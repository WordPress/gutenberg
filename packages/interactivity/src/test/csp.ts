/**
 * Unit tests for CSP nonce support (csp.ts).
 *
 * csp.ts evaluates `data-nonce` at import time, so each scenario uses
 * `jest.resetModules()` + dynamic `import('../csp')` after setting the
 * attribute. jsdom does not enforce CSP — we verify the nonce attribute,
 * script injection, caching, and Trusted Types delegation.
 */

describe( 'Interactivity API CSP', () => {
	const originalTrustedTypes = ( window as any ).trustedTypes;

	afterEach( () => {
		document.documentElement.removeAttribute( 'data-nonce' );
		( window as any ).trustedTypes = originalTrustedTypes;
		jest.resetModules();
		jest.restoreAllMocks();
	} );

	describe( 'fallback (no data-nonce)', () => {
		it( 'isCSPEnabled() is false and getPageNonce() is null', async () => {
			document.documentElement.removeAttribute( 'data-nonce' );
			jest.resetModules();
			const csp = await import( '../csp' );
			expect( csp.isCSPEnabled() ).toBe( false );
			expect( csp.getPageNonce() ).toBeNull();
		} );

		it( 'compileExpression falls back to Function() and is callable', async () => {
			document.documentElement.removeAttribute( 'data-nonce' );
			jest.resetModules();
			const { compileExpression } = await import( '../csp' );
			const fn = compileExpression(
				[ 'state', 'context' ],
				'return state.count + context.n;'
			);
			expect( typeof fn ).toBe( 'function' );
			expect( fn( { count: 2 }, { n: 3 } ) ).toBe( 5 );
		} );

		it( 'prepareScript does not set nonce and sets text directly', async () => {
			document.documentElement.removeAttribute( 'data-nonce' );
			jest.resetModules();
			const { prepareScript } = await import( '../csp' );
			const script = document.createElement( 'script' );
			prepareScript( script, 'console.log(1)' );
			expect( script.nonce ).toBe( '' );
			expect( script.text ).toBe( 'console.log(1)' );
		} );

		it( 'createHTML returns raw html when no policy', async () => {
			document.documentElement.removeAttribute( 'data-nonce' );
			jest.resetModules();
			const { createHTML } = await import( '../csp' );
			expect( createHTML( '<div>hi</div>' ) ).toBe( '<div>hi</div>' );
		} );
	} );

	describe( 'CSP enabled (data-nonce present)', () => {
		it( 'isCSPEnabled() is true, getPageNonce() returns value, and attribute is removed', async () => {
			document.documentElement.setAttribute( 'data-nonce', 'abc123' );
			jest.resetModules();
			const csp = await import( '../csp' );
			expect( csp.isCSPEnabled() ).toBe( true );
			expect( csp.getPageNonce() ).toBe( 'abc123' );
			expect(
				document.documentElement.hasAttribute( 'data-nonce' )
			).toBe( false );
		} );

		it( 'throws on empty data-nonce', async () => {
			document.documentElement.setAttribute( 'data-nonce', '' );
			jest.resetModules();
			await expect( import( '../csp' ) ).rejects.toThrow(
				'nonempty html data-nonce'
			);
		} );

		it( 'compileExpression injects nonced script and returns callable', async () => {
			document.documentElement.setAttribute( 'data-nonce', 'test-nonce' );
			jest.resetModules();
			const { compileExpression } = await import( '../csp' );
			const fn = compileExpression(
				[ 'state', 'context' ],
				'return state.count + context.n;'
			);
			expect( typeof fn ).toBe( 'function' );
			expect( fn( { count: 2 }, { n: 3 } ) ).toBe( 5 );
			// Script is removed after execution, but nonce was used.
			// Verify no leftover script with that content remains.
			expect(
				document.head.querySelector( 'script' )
			).toBeNull();
		} );

		it( 'compileExpression caches by source', async () => {
			document.documentElement.setAttribute( 'data-nonce', 'cache-nonce' );
			jest.resetModules();
			const { compileExpression } = await import( '../csp' );
			const fn1 = compileExpression( [ 'x' ], 'return x+1;' );
			const fn2 = compileExpression( [ 'x' ], 'return x+1;' );
			expect( fn1 ).toBe( fn2 );
			const fn3 = compileExpression( [ 'x' ], 'return x+2;' );
			expect( fn3 ).not.toBe( fn1 );
		} );

		it( 'prepareScript sets nonce and text', async () => {
			document.documentElement.setAttribute( 'data-nonce', 'prep-nonce' );
			jest.resetModules();
			const { prepareScript } = await import( '../csp' );
			const script = document.createElement( 'script' );
			prepareScript( script, 'alert(1)' );
			expect( script.nonce ).toBe( 'prep-nonce' );
			expect( script.text ).toBe( 'alert(1)' );
		} );

		it( 'uses Trusted Types policy when available', async () => {
			const createScript = jest.fn( ( s: string ) => `policy:${ s }` );
			const createHTML = jest.fn( ( h: string ) => `html:${ h }` );
			( window as any ).trustedTypes = {
				createPolicy: jest.fn( () => ( { createScript, createHTML } ) ),
			};
			document.documentElement.setAttribute( 'data-nonce', 'tt-nonce' );
			jest.resetModules();
			const { prepareScript, createHTML: cHTML } = await import(
				'../csp'
			);
			expect(
				( window as any ).trustedTypes.createPolicy
			).toHaveBeenCalledWith( 'wp-interactivity', expect.any( Object ) );
			const script = document.createElement( 'script' );
			prepareScript( script, 'x' );
			expect( createScript ).toHaveBeenCalledWith( 'x' );
			expect( script.text ).toBe( 'policy:x' );
			expect( cHTML( '<b>' ) ).toBe( 'html:<b>' );
			expect( createHTML ).toHaveBeenCalledWith( '<b>' );
		} );

		it( 'compileExpression throws when CSP blocks (no x on script)', async () => {
			document.documentElement.setAttribute( 'data-nonce', 'block-nonce' );
			jest.resetModules();
			const { compileExpression } = await import( '../csp' );
			// Simulate CSP blocking: jsdom executes inline scripts on
			// appendChild, so we mock appendChild to *not* execute — the
			// script never gets `x` set and compileExpression must throw.
			jest.spyOn( document.head, 'appendChild' ).mockImplementation(
				( node: Node ) => node
			);
			expect( () => compileExpression( [ 'x' ], 'return x;' ) ).toThrow(
				'CSP blocked'
			);
		} );
	} );
} );
