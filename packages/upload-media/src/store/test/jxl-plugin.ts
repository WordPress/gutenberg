/**
 * External dependencies
 */
const mockSaveEntityRecord = jest.fn();
const mockCanUser = jest.fn();

jest.mock( '@wordpress/data', () => ( {
	dispatch: () => ( { saveEntityRecord: mockSaveEntityRecord } ),
	resolveSelect: () => ( { canUser: mockCanUser } ),
} ) );

/**
 * Internal dependencies
 */
import {
	ensureVipsJxlAvailable,
	__resetCachedConfigForTesting,
} from '../utils/jxl-plugin';

type MutableWindow = typeof window & {
	__vipsJxlConfig?: unknown;
	wpApiSettings?: { root?: string; nonce?: string };
};

const testWindow = window as MutableWindow;

describe( 'jxl-plugin', () => {
	const originalFetch = window.fetch;
	const originalConfig = testWindow.__vipsJxlConfig;
	const originalWpApiSettings = testWindow.wpApiSettings;
	let warnSpy: jest.SpyInstance;

	beforeEach( () => {
		__resetCachedConfigForTesting();
		mockSaveEntityRecord.mockReset();
		mockCanUser.mockReset();
		delete testWindow.__vipsJxlConfig;
		testWindow.wpApiSettings = { root: '/wp-json/', nonce: 'nonce-123' };
		warnSpy = jest.spyOn( console, 'warn' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		window.fetch = originalFetch;
		testWindow.__vipsJxlConfig = originalConfig;
		testWindow.wpApiSettings = originalWpApiSettings;
		warnSpy.mockRestore();
	} );

	describe( 'ensureVipsJxlAvailable', () => {
		it( 'returns config when plugin is already active', async () => {
			testWindow.__vipsJxlConfig = {
				wasmUrl: 'https://example.test/vips-jxl.wasm',
			};
			const config = await ensureVipsJxlAvailable();
			expect( config ).toEqual( {
				wasmUrl: 'https://example.test/vips-jxl.wasm',
			} );
			expect( mockSaveEntityRecord ).not.toHaveBeenCalled();
			expect( mockCanUser ).not.toHaveBeenCalled();
		} );

		it( 'ignores malformed window config and falls through to install path', async () => {
			testWindow.__vipsJxlConfig = { wasmUrl: 123 };
			mockCanUser.mockResolvedValue( false );
			const config = await ensureVipsJxlAvailable();
			expect( config ).toBeNull();
			expect( mockCanUser ).toHaveBeenCalledWith( 'create', {
				kind: 'root',
				name: 'plugin',
			} );
		} );

		it( 'rejects window config with empty wasmUrl', async () => {
			testWindow.__vipsJxlConfig = { wasmUrl: '' };
			mockCanUser.mockResolvedValue( false );
			const config = await ensureVipsJxlAvailable();
			expect( config ).toBeNull();
		} );

		it( 'returns null when user cannot install plugins', async () => {
			mockCanUser.mockResolvedValue( false );
			const config = await ensureVipsJxlAvailable();
			expect( config ).toBeNull();
			expect( mockSaveEntityRecord ).not.toHaveBeenCalled();
		} );

		it( 'installs and fetches config when user can install', async () => {
			mockCanUser.mockResolvedValue( true );
			mockSaveEntityRecord.mockResolvedValue( {} );
			window.fetch = jest.fn().mockResolvedValue( {
				ok: true,
				json: async () => ( {
					wasmUrl: 'https://example.test/installed.wasm',
				} ),
			} ) as typeof window.fetch;

			const config = await ensureVipsJxlAvailable();

			expect( config ).toEqual( {
				wasmUrl: 'https://example.test/installed.wasm',
			} );
			expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
				'root',
				'plugin',
				{ slug: 'wp-vips-jxl', status: 'active' },
				{ throwOnError: true }
			);
			expect( window.fetch ).toHaveBeenCalledWith(
				'/wp-json/wp-vips-jxl/v1/config',
				expect.objectContaining( {
					credentials: 'same-origin',
					headers: { 'X-WP-Nonce': 'nonce-123' },
				} )
			);
			expect( testWindow.__vipsJxlConfig ).toEqual( {
				wasmUrl: 'https://example.test/installed.wasm',
			} );
		} );

		it( 'returns null when plugin install fails', async () => {
			mockCanUser.mockResolvedValue( true );
			mockSaveEntityRecord.mockRejectedValue( new Error( 'forbidden' ) );
			const config = await ensureVipsJxlAvailable();
			expect( config ).toBeNull();
			expect( warnSpy ).toHaveBeenCalledWith(
				'wp-vips-jxl: plugin install failed',
				expect.any( Error )
			);
		} );

		it( 'returns null when REST config returns non-ok status', async () => {
			mockCanUser.mockResolvedValue( true );
			mockSaveEntityRecord.mockResolvedValue( {} );
			window.fetch = jest.fn().mockResolvedValue( {
				ok: false,
				status: 404,
				json: async () => ( {} ),
			} ) as typeof window.fetch;
			const config = await ensureVipsJxlAvailable();
			expect( config ).toBeNull();
			expect( warnSpy ).toHaveBeenCalledWith(
				expect.stringContaining( 'returned 404' )
			);
		} );

		it( 'returns null when REST config returns malformed body', async () => {
			mockCanUser.mockResolvedValue( true );
			mockSaveEntityRecord.mockResolvedValue( {} );
			window.fetch = jest.fn().mockResolvedValue( {
				ok: true,
				json: async () => ( { not_wasm_url: 'whatever' } ),
			} ) as typeof window.fetch;
			const config = await ensureVipsJxlAvailable();
			expect( config ).toBeNull();
			expect( warnSpy ).toHaveBeenCalledWith(
				expect.stringContaining( 'malformed' )
			);
		} );

		it( 'returns null when fetch throws', async () => {
			mockCanUser.mockResolvedValue( true );
			mockSaveEntityRecord.mockResolvedValue( {} );
			window.fetch = jest
				.fn()
				.mockRejectedValue(
					new Error( 'network' )
				) as typeof window.fetch;
			const config = await ensureVipsJxlAvailable();
			expect( config ).toBeNull();
			expect( warnSpy ).toHaveBeenCalledWith(
				'wp-vips-jxl: failed to fetch config',
				expect.any( Error )
			);
		} );

		it( 'caches the successful result for subsequent calls', async () => {
			testWindow.__vipsJxlConfig = {
				wasmUrl: 'https://example.test/cached.wasm',
			};
			const first = await ensureVipsJxlAvailable();
			// Remove the global; the cache should still serve the result.
			delete testWindow.__vipsJxlConfig;
			const second = await ensureVipsJxlAvailable();
			expect( second ).toEqual( first );
			expect( mockCanUser ).not.toHaveBeenCalled();
		} );

		it( 'caches null once the user cannot install', async () => {
			mockCanUser.mockResolvedValue( false );
			await ensureVipsJxlAvailable();
			await ensureVipsJxlAvailable();
			expect( mockCanUser ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'uses default REST root when wpApiSettings is missing', async () => {
			delete testWindow.wpApiSettings;
			mockCanUser.mockResolvedValue( true );
			mockSaveEntityRecord.mockResolvedValue( {} );
			const fetchMock = jest.fn().mockResolvedValue( {
				ok: true,
				json: async () => ( {
					wasmUrl: 'https://example.test/default-root.wasm',
				} ),
			} ) as unknown as typeof window.fetch;
			window.fetch = fetchMock;
			await ensureVipsJxlAvailable();
			expect( fetchMock ).toHaveBeenCalledWith(
				'/wp-json/wp-vips-jxl/v1/config',
				expect.objectContaining( {
					headers: { 'X-WP-Nonce': '' },
				} )
			);
		} );
	} );
} );
