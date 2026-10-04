import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

/**
 * Module sources returned by the mocked `fetch()`, keyed by URL.
 */
const sources: Record< string, string > = {
	'https://example.com/new.js': [
		"import dep from 'test/dep';",
		"import initial from 'test/initial';",
		'export default dep + initial;',
		"export const lazy = () => import( 'test/lazy' );",
	].join( '\n' ),
	// The escape sequence makes the lexer decode the module specifier.
	'https://example.com/dep.js': [
		"import esc from './\\u0065sc.js';",
		'export default esc;',
	].join( '\n' ),
	'https://example.com/esc.js': "export default 'esc';",
};

describe( 'dynamic import map', () => {
	const blobs = new Map< string, Blob >();
	let evalMock: Mock;
	let compileMock: Mock;

	/**
	 * Reads the module source stored in the passed Blob URL.
	 *
	 * @param blobUrl Blob URL created by the loader.
	 * @return Promise with the module source.
	 */
	const readBlob = ( blobUrl: string | undefined ) => {
		const blob = blobUrl ? blobs.get( blobUrl ) : undefined;
		if ( ! blob ) {
			throw new Error( `No Blob was created for ${ blobUrl }.` );
		}
		return blob.text();
	};

	beforeEach( () => {
		// Simulate a Content Security Policy without `'unsafe-eval'` and
		// `'wasm-unsafe-eval'`: `eval()` throws and WebAssembly can't be
		// compiled.
		evalMock = vi.fn( () => {
			throw new EvalError( 'Code generation from strings disallowed.' );
		} );
		compileMock = vi.fn( () =>
			Promise.reject( new Error( 'WebAssembly compilation disallowed.' ) )
		);
		vi.stubGlobal( 'eval', evalMock );
		vi.stubGlobal( 'WebAssembly', {
			compile: compileMock,
			instantiate: compileMock,
		} );

		vi.stubGlobal(
			'fetch',
			vi.fn( async ( url: string ) => ( {
				ok: url in sources,
				status: url in sources ? 200 : 404,
				url,
				headers: { get: () => 'text/javascript' },
				text: async () => sources[ url ],
			} ) )
		);

		// jsdom doesn't implement `URL.createObjectURL()`. Keep the created
		// Blobs so the test can read the rewritten module sources back.
		blobs.clear();
		vi.stubGlobal(
			'URL',
			class extends URL {
				static createObjectURL( blob: Blob ) {
					const blobUrl = `blob:http://localhost/${ blobs.size }`;
					blobs.set( blobUrl, blob );
					return blobUrl;
				}
			}
		);

		// The loader reads the initial import map when it is evaluated.
		document.head.innerHTML = `<script type="importmap" id="wp-importmap">${ JSON.stringify(
			{ imports: { 'test/initial': 'https://example.com/initial.js' } }
		) }</script>`;
	} );

	it( 'preloads modules without using eval() or WebAssembly', async () => {
		// Imported after the globals are stubbed, so the lexer is evaluated
		// under the simulated Content Security Policy. The module defines a
		// non-configurable global and reads the import map when it's
		// evaluated, so this file can only import it once.
		const { preloadWithMap } = await import( '../dynamic-importmap' );

		const load = await preloadWithMap( 'test/new', {
			imports: {
				'test/new': 'https://example.com/new.js',
				'test/dep': 'https://example.com/dep.js',
				'test/lazy': 'https://example.com/lazy.js',
			},
		} );

		const [ dep, initial ] = load.deps ?? [];
		const [ esc ] = dep.deps ?? [];
		expect( dep.url ).toBe( 'https://example.com/dep.js' );
		expect( esc.url ).toBe( 'https://example.com/esc.js' );
		// Modules in the initial import map are left to the browser.
		expect( initial.blobUrl ).toBe( 'test/initial' );

		// Static imports point to the Blob URLs of the fetched dependencies,
		// and dynamic imports go through the router's import function.
		const source = await readBlob( load.blobUrl );
		expect( source ).toContain( `'${ dep.blobUrl }'` );
		expect( source ).toMatch(
			/wpInteractivityRouterImport\(\s*'test\/lazy'/
		);
		expect( await readBlob( dep.blobUrl ) ).toContain(
			`'${ esc.blobUrl }'`
		);

		expect( evalMock ).not.toHaveBeenCalled();
		expect( compileMock ).not.toHaveBeenCalled();
	} );
} );
