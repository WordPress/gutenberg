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

	it( 'tries the tag of a patch release before its branch', () => {
		expect( getTestSuiteRefs( '7.1.3' ) ).toEqual( [
			{ type: 'tag', name: '7.1.3' },
			{ type: 'branch', name: '7.1' },
		] );
	} );

	it( 'adds the .0 that wordpress-develop tags use to a non-patch release', () => {
		expect( getTestSuiteRefs( '7.1' ) ).toEqual( [
			{ type: 'tag', name: '7.1.0' },
			{ type: 'branch', name: '7.1' },
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
 * Creates a fake SimpleGit instance whose `ls-remote` lists the given refs.
 *
 * @param {string[]} existing The full names of the refs that exist, such as `refs/heads/trunk`.
 * @param {?Error}   error    An error for every git command to throw.
 * @return {Object} The fake, which records each call in `calls`.
 */
function createGit( existing = [], error = null ) {
	const calls = [];
	return {
		calls,
		async raw( args ) {
			calls.push( [ 'raw', ...args ] );
			if ( error ) {
				throw error;
			}
			if ( args[ 0 ] === 'ls-remote' ) {
				return existing
					.filter( ( ref ) => args.includes( ref ) )
					.map( ( ref ) => `0123abcd\t${ ref }\n` )
					.join( '' );
			}
			return '';
		},
		async checkout( ref ) {
			calls.push( [ 'checkout', ref ] );
		},
	};
}

const noop = () => {};

describe( 'fetchTestSuite', () => {
	it( 'fetches a tag and checks out what was fetched', async () => {
		const git = createGit( [ 'refs/tags/7.1.3', 'refs/heads/7.1' ] );
		await fetchTestSuite(
			git,
			[
				{ type: 'tag', name: '7.1.3' },
				{ type: 'branch', name: '7.1' },
			],
			noop
		);
		expect( git.calls ).toEqual( [
			[
				'raw',
				'ls-remote',
				'origin',
				'refs/tags/7.1.3',
				'refs/heads/7.1',
			],
			[ 'raw', 'fetch', 'origin', 'tag', '7.1.3', '--depth', '1' ],
			[ 'checkout', 'FETCH_HEAD' ],
		] );
	} );

	it( 'uses the first branch that exists', async () => {
		const git = createGit( [ 'refs/heads/7.1', 'refs/heads/trunk' ] );
		await fetchTestSuite(
			git,
			[ { type: 'branch', name: '7.1' }, TRUNK ],
			noop
		);
		expect( git.calls ).toEqual( [
			[
				'raw',
				'ls-remote',
				'origin',
				'refs/heads/7.1',
				'refs/heads/trunk',
			],
			[ 'raw', 'fetch', 'origin', '7.1', '--depth', '1' ],
			[ 'checkout', 'FETCH_HEAD' ],
		] );
	} );

	it( 'falls back to trunk when the branch does not exist yet', async () => {
		const git = createGit( [ 'refs/heads/trunk' ] );
		await fetchTestSuite(
			git,
			[ { type: 'branch', name: '7.2' }, TRUNK ],
			noop
		);
		expect( git.calls.slice( 1 ) ).toEqual( [
			[ 'raw', 'fetch', 'origin', 'trunk', '--depth', '1' ],
			[ 'checkout', 'FETCH_HEAD' ],
		] );
	} );

	it( 'falls back to the branch when the tag does not exist yet', async () => {
		const git = createGit( [ 'refs/heads/7.1' ] );
		await fetchTestSuite(
			git,
			[
				{ type: 'tag', name: '7.1.4' },
				{ type: 'branch', name: '7.1' },
			],
			noop
		);
		expect( git.calls.slice( 1 ) ).toEqual( [
			[ 'raw', 'fetch', 'origin', '7.1', '--depth', '1' ],
			[ 'checkout', 'FETCH_HEAD' ],
		] );
	} );

	it( 'throws when listing the refs fails', async () => {
		const git = createGit(
			[],
			new Error( 'fatal: unable to access the repository' )
		);
		await expect(
			fetchTestSuite(
				git,
				[ { type: 'branch', name: '7.1' }, TRUNK ],
				noop
			)
		).rejects.toThrow( 'unable to access' );
		expect( git.calls ).toHaveLength( 1 );
	} );

	it( 'throws when none of the refs exist', async () => {
		const git = createGit();
		await expect(
			fetchTestSuite(
				git,
				[
					{ type: 'tag', name: '7.1.9' },
					{ type: 'branch', name: '7.1' },
				],
				noop
			)
		).rejects.toThrow( 'Tried: tag 7.1.9, branch 7.1.' );
		expect( git.calls ).toHaveLength( 1 );
	} );
} );
