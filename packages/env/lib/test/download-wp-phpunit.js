'use strict';
/**
 * Internal dependencies
 */
const {
	getTestSuiteRefs,
	fetchTestSuite,
} = require( '../runtime/docker/download-wp-phpunit' );

const TRUNK = { type: 'branch', name: 'trunk' };

describe( 'getTestSuiteRefs', () => {
	it( 'uses trunk when the version is unknown', () => {
		expect( getTestSuiteRefs( null ) ).toEqual( [ TRUNK ] );
		expect( getTestSuiteRefs( '' ) ).toEqual( [ TRUNK ] );
	} );

	it( 'uses the tag of a patch release', () => {
		expect( getTestSuiteRefs( '7.1.3' ) ).toEqual( [
			{ type: 'tag', name: '7.1.3' },
		] );
	} );

	it( 'adds the .0 that wordpress-develop tags use to a non-patch release', () => {
		expect( getTestSuiteRefs( '7.1' ) ).toEqual( [
			{ type: 'tag', name: '7.1.0' },
		] );
	} );

	it.each( [
		[ '7.1.4-alpha-64164', '7.1' ],
		[ '7.1-RC2', '7.1' ],
		[ '7.1-beta1', '7.1' ],
		[ '7.2-alpha-61234', '7.2' ],
		[ '10.0.1-rc1', '10.0' ],
	] )(
		'tries the %s pre-release on its %s branch before trunk',
		( version, branch ) => {
			expect( getTestSuiteRefs( version ) ).toEqual( [
				{ type: 'branch', name: branch },
				TRUNK,
			] );
		}
	);

	it( 'uses any other version as a tag', () => {
		expect( getTestSuiteRefs( 'custom' ) ).toEqual( [
			{ type: 'tag', name: 'custom' },
		] );
	} );
} );

/**
 * Creates a fake SimpleGit instance whose fetches fail for the given refs.
 *
 * @param {Object<string, string>} failures Error messages, keyed by the ref name whose fetch fails.
 * @return {Object} The fake, which records each call in `calls`.
 */
function createGit( failures = {} ) {
	const calls = [];
	return {
		calls,
		async raw( args ) {
			calls.push( [ 'raw', ...args ] );
			const name = args[ args.length - 3 ];
			if ( failures[ name ] ) {
				throw new Error( failures[ name ] );
			}
		},
		async checkout( ref ) {
			calls.push( [ 'checkout', ref ] );
		},
	};
}

const noop = () => {};

describe( 'fetchTestSuite', () => {
	it( 'fetches a tag and checks out what was fetched', async () => {
		const git = createGit();
		await fetchTestSuite( git, [ { type: 'tag', name: '7.1.3' } ], noop );
		expect( git.calls ).toEqual( [
			[ 'raw', 'fetch', 'origin', 'tag', '7.1.3', '--depth', '1' ],
			[ 'checkout', 'FETCH_HEAD' ],
		] );
	} );

	it( 'uses the first branch that exists', async () => {
		const git = createGit();
		await fetchTestSuite(
			git,
			[ { type: 'branch', name: '7.1' }, TRUNK ],
			noop
		);
		expect( git.calls ).toEqual( [
			[ 'raw', 'fetch', 'origin', '7.1', '--depth', '1' ],
			[ 'checkout', 'FETCH_HEAD' ],
		] );
	} );

	it( 'falls back to trunk when the branch does not exist yet', async () => {
		const git = createGit( {
			7.2: "fatal: couldn't find remote ref 7.2",
		} );
		await fetchTestSuite(
			git,
			[ { type: 'branch', name: '7.2' }, TRUNK ],
			noop
		);
		expect( git.calls ).toEqual( [
			[ 'raw', 'fetch', 'origin', '7.2', '--depth', '1' ],
			[ 'raw', 'fetch', 'origin', 'trunk', '--depth', '1' ],
			[ 'checkout', 'FETCH_HEAD' ],
		] );
	} );

	it( 'does not fall back on other errors', async () => {
		const git = createGit( {
			7.1: 'fatal: unable to access the repository',
		} );
		await expect(
			fetchTestSuite(
				git,
				[ { type: 'branch', name: '7.1' }, TRUNK ],
				noop
			)
		).rejects.toThrow( 'unable to access' );
		expect( git.calls ).toHaveLength( 1 );
	} );

	it( 'throws when the last ref does not exist', async () => {
		const git = createGit( {
			'7.1.9': "fatal: couldn't find remote ref refs/tags/7.1.9",
		} );
		await expect(
			fetchTestSuite( git, [ { type: 'tag', name: '7.1.9' } ], noop )
		).rejects.toThrow( "couldn't find remote ref" );
		expect( git.calls ).toHaveLength( 1 );
	} );
} );
