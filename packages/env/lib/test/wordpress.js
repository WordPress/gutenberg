'use strict';

jest.mock( 'dns', () => ( {
	promises: {
		resolve: jest.fn(),
	},
} ) );
jest.mock( 'got', () => jest.fn() );
jest.mock( 'simple-git', () => jest.fn() );
jest.mock( '../cache', () => ( {
	getCache: jest.fn(),
	setCache: jest.fn(),
} ) );

const cacheOptions = { cacheDirectoryPath: '/a/b/c' };

function mockStableCheck( got, version ) {
	got.mockReturnValue( {
		json: () =>
			Promise.resolve( {
				[ version ]: 'latest',
			} ),
	} );
}

function mockMirrorHasTag( SimpleGit, hasTag ) {
	SimpleGit.mockReturnValue( {
		listRemote: () =>
			Promise.resolve( hasTag ? 'abc123\trefs/tags/x.y.z\n' : '' ),
	} );
}

// `getLatestWordPressVersion` memoizes its result in a module-level variable,
// so each test resets the module registry and re-requires its dependencies
// fresh to get an unmemoized copy with its own mock state.
describe( 'getLatestWordPressVersion', () => {
	beforeEach( () => {
		jest.resetModules();
	} );

	it( 'returns the version reported as latest when the mirror already has the tag', async () => {
		const dns = require( 'dns' ).promises;
		const got = require( 'got' );
		const SimpleGit = require( 'simple-git' );
		const { setCache } = require( '../cache' );
		const { getLatestWordPressVersion } = require( '../wordpress' );

		dns.resolve.mockResolvedValue( [ '127.0.0.1' ] );
		mockStableCheck( got, '6.6.0' );
		mockMirrorHasTag( SimpleGit, true );

		const version = await getLatestWordPressVersion( cacheOptions );

		expect( version ).toBe( '6.6.0' );
		expect( setCache ).toHaveBeenCalledWith(
			'latestWordPressVersion',
			'6.6.0',
			expect.anything()
		);
	} );

	it( 'falls back to the last known good version when the mirror has not synced the new tag yet', async () => {
		const dns = require( 'dns' ).promises;
		const got = require( 'got' );
		const SimpleGit = require( 'simple-git' );
		const { getCache, setCache } = require( '../cache' );
		const { getLatestWordPressVersion } = require( '../wordpress' );

		dns.resolve.mockResolvedValue( [ '127.0.0.1' ] );
		mockStableCheck( got, '6.6.0' );
		mockMirrorHasTag( SimpleGit, false );
		getCache.mockResolvedValue( '6.5.9' );

		const version = await getLatestWordPressVersion( cacheOptions );

		expect( version ).toBe( '6.5.9' );
		expect( setCache ).not.toHaveBeenCalled();
	} );

	it( 'uses the reported version anyway when the mirror is missing it and there is no cached fallback', async () => {
		const dns = require( 'dns' ).promises;
		const got = require( 'got' );
		const SimpleGit = require( 'simple-git' );
		const { getCache } = require( '../cache' );
		const { getLatestWordPressVersion } = require( '../wordpress' );

		dns.resolve.mockResolvedValue( [ '127.0.0.1' ] );
		mockStableCheck( got, '6.6.0' );
		mockMirrorHasTag( SimpleGit, false );
		getCache.mockResolvedValue( undefined );

		const version = await getLatestWordPressVersion( cacheOptions );

		expect( version ).toBe( '6.6.0' );
	} );

	it( 'does not fail the whole lookup if the mirror check itself errors', async () => {
		const dns = require( 'dns' ).promises;
		const got = require( 'got' );
		const SimpleGit = require( 'simple-git' );
		const { getLatestWordPressVersion } = require( '../wordpress' );

		dns.resolve.mockResolvedValue( [ '127.0.0.1' ] );
		mockStableCheck( got, '6.6.0' );
		SimpleGit.mockReturnValue( {
			listRemote: () => Promise.reject( new Error( 'network error' ) ),
		} );

		const version = await getLatestWordPressVersion( cacheOptions );

		expect( version ).toBe( '6.6.0' );
	} );
} );
