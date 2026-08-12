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

function mockMirrorTags( SimpleGit, tags ) {
	SimpleGit.mockReturnValue( {
		listRemote: () =>
			Promise.resolve(
				tags.map( ( tag ) => `abc\trefs/tags/${ tag }` ).join( '\n' )
			),
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
		mockMirrorTags( SimpleGit, [ '6.5.9', '6.6.0' ] );

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
		const { getCache } = require( '../cache' );
		const { getLatestWordPressVersion } = require( '../wordpress' );

		dns.resolve.mockResolvedValue( [ '127.0.0.1' ] );
		mockStableCheck( got, '6.6.0' );
		mockMirrorTags( SimpleGit, [ '6.5.8', '6.5.9' ] ); // No 6.6.0 yet.
		getCache.mockResolvedValue( '6.5.9' );

		const version = await getLatestWordPressVersion( cacheOptions );

		expect( version ).toBe( '6.5.9' );
	} );

	it( 'falls back to the highest version on the mirror when there is no cache at all, such as a fresh CI runner', async () => {
		const dns = require( 'dns' ).promises;
		const got = require( 'got' );
		const SimpleGit = require( 'simple-git' );
		const { getCache, setCache } = require( '../cache' );
		const { getLatestWordPressVersion } = require( '../wordpress' );

		dns.resolve.mockResolvedValue( [ '127.0.0.1' ] );
		mockStableCheck( got, '6.6.0' );
		mockMirrorTags( SimpleGit, [
			'6.5.8',
			'6.5.10',
			'6.5.9',
			'not-a-version',
		] );
		getCache.mockResolvedValue( undefined );

		const version = await getLatestWordPressVersion( cacheOptions );

		expect( version ).toBe( '6.5.10' );
		expect( setCache ).toHaveBeenCalledWith(
			'latestWordPressVersion',
			'6.5.10',
			expect.anything()
		);
	} );

	it( 'uses the reported version anyway when the mirror listing itself fails', async () => {
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
