const fs = require( 'node:fs' );
const path = require( 'node:path' );
const {
	resolveBranches,
	resolveShards,
	computeBuildKey,
	getTestedUpToMajor,
	REFERENCE_COMMIT,
} = require( '../resolve-performance-branches.mjs' );

const sha = 'a'.repeat( 40 );
const baseSha = 'b'.repeat( 40 );
const releaseSha = 'c'.repeat( 40 );
const resolveRef = () => releaseSha;

describe( 'getTestedUpToMajor', () => {
	it( 'returns major.minor', () => {
		expect( getTestedUpToMajor( 'Tested up to: 7.1.2\n' ) ).toBe( '7.1' );
	} );

	it( 'throws when the flag is missing', () => {
		expect( () => getTestedUpToMajor( '' ) ).toThrow( 'Tested up to' );
	} );
} );

describe( 'resolveBranches', () => {
	it( 'compares a pull request with its base commit', () => {
		expect(
			resolveBranches( {
				event: 'pull_request',
				sha,
				wpMajor: '7.1',
				resolveRef,
				baseSha,
				baseRef: 'trunk',
			} )
		).toEqual( {
			branches: [
				{ name: sha, ref: sha, artifact: `plugin-${ sha }`, sha },
				{
					name: 'trunk',
					ref: baseSha,
					artifact: 'plugin-trunk',
					sha: baseSha,
					reuse: 'sha',
				},
			],
			wpVersion: '',
		} );
	} );

	it( 'does not reuse a build for a base branch that is not trunk', () => {
		const { branches } = resolveBranches( {
			event: 'pull_request',
			sha,
			wpMajor: '7.1',
			resolveRef,
			baseSha,
			baseRef: 'release/24.0',
		} );
		expect( branches[ 1 ].reuse ).toBeUndefined();
	} );

	it( 'compares a push with the reference commit on the tested WP version', () => {
		expect(
			resolveBranches( {
				event: 'push',
				sha,
				wpMajor: '7.1',
				resolveRef,
			} )
		).toEqual( {
			branches: [
				{ name: sha, ref: sha, artifact: `plugin-${ sha }`, sha },
				{
					name: REFERENCE_COMMIT,
					ref: REFERENCE_COMMIT,
					artifact: `plugin-${ REFERENCE_COMMIT }`,
					sha: REFERENCE_COMMIT,
					reuse: 'name',
				},
			],
			wpVersion: '7.1',
		} );
	} );

	it( 'compares a release with WP core and the previous release', () => {
		expect(
			resolveBranches( {
				event: 'release',
				sha,
				wpMajor: '7.1',
				resolveRef,
				releaseTag: 'v24.0.0-rc.1',
			} )
		).toEqual( {
			branches: [
				{
					name: 'wp/7.1',
					ref: 'wp/7.1',
					artifact: 'plugin-wp-7-1',
					sha: releaseSha,
				},
				{
					name: 'release/23.9',
					ref: 'release/23.9',
					artifact: 'plugin-release-23-9',
					sha: releaseSha,
				},
				{
					name: 'release/24.0',
					ref: 'release/24.0',
					artifact: 'plugin-release-24-0',
					sha: releaseSha,
				},
			],
			wpVersion: '7.1',
		} );
	} );

	it( 'rejects release tags that are not plugin versions', () => {
		expect( () =>
			resolveBranches( {
				event: 'release',
				sha,
				wpMajor: '7.1',
				resolveRef,
				releaseTag: 'v24.0',
			} )
		).toThrow( "Release tag 'v24.0' does not resolve" );
	} );

	it( 'checks the release tag among tags and the branches among heads', () => {
		const seen = [];
		resolveBranches( {
			event: 'release',
			sha,
			wpMajor: '7.1',
			resolveRef: ( ref, kind ) => {
				seen.push( `${ kind }:${ ref }` );
				return releaseSha;
			},
			releaseTag: 'v24.0.0',
		} );
		expect( seen ).toEqual( [
			'tag:v24.0.0',
			'head:release/24.0',
			'head:release/23.9',
			'head:wp/7.1',
		] );
	} );

	it( 'rejects releases whose branches do not exist', () => {
		expect( () =>
			resolveBranches( {
				event: 'release',
				sha,
				wpMajor: '7.1',
				resolveRef: ( ref ) =>
					ref === 'release/23.9' ? '' : releaseSha,
				releaseTag: 'v24.0.0',
			} )
		).toThrow( "previous release branch 'release/23.9'" );
	} );

	it( 'splits the branches input of a manual run', () => {
		expect(
			resolveBranches( {
				event: 'workflow_dispatch',
				sha,
				wpMajor: '7.1',
				resolveRef,
				inputBranches: ' trunk, v23.8.0 ,,',
				inputWpVersion: '7.0',
			} )
		).toEqual( {
			branches: [
				{
					name: 'trunk',
					ref: 'trunk',
					artifact: 'plugin-trunk',
					sha: releaseSha,
				},
				{
					name: 'v23.8.0',
					ref: 'v23.8.0',
					artifact: 'plugin-v23-8-0',
					sha: releaseSha,
				},
			],
			wpVersion: '7.0',
		} );
	} );

	it( 'builds a manual ref that does not resolve, without reusing it', () => {
		const { branches } = resolveBranches( {
			event: 'workflow_dispatch',
			sha,
			wpMajor: '7.1',
			resolveRef: () => '',
			inputBranches: 'trunk,my-branch',
		} );
		expect( branches.map( ( item ) => item.sha ) ).toEqual( [
			undefined,
			undefined,
		] );
		expect( branches.map( ( item ) => item.ref ) ).toEqual( [
			'trunk',
			'my-branch',
		] );
	} );

	it( 'rejects manual runs with fewer than two branches', () => {
		expect( () =>
			resolveBranches( {
				event: 'workflow_dispatch',
				sha,
				wpMajor: '7.1',
				resolveRef,
				inputBranches: 'trunk,',
			} )
		).toThrow( 'at least two branches' );
	} );

	it( 'rejects manual runs whose branches collide once sanitized', () => {
		expect( () =>
			resolveBranches( {
				event: 'workflow_dispatch',
				sha,
				wpMajor: '7.1',
				resolveRef,
				inputBranches: 'wp/6.9,wp-6.9',
			} )
		).toThrow( 'plugin-wp-6-9' );
	} );

	it( 'rejects releases whose WP branch does not exist', () => {
		expect( () =>
			resolveBranches( {
				event: 'release',
				sha,
				wpMajor: '7.1',
				resolveRef: ( ref ) => ( ref === 'wp/7.1' ? '' : releaseSha ),
				releaseTag: 'v24.0.0',
			} )
		).toThrow( "WordPress branch 'wp/7.1'" );
	} );

	it( 'rejects unknown events', () => {
		expect( () =>
			resolveBranches( {
				event: 'schedule',
				sha,
				wpMajor: '7.1',
				resolveRef,
			} )
		).toThrow( 'Unsupported event' );
	} );
} );

describe( 'computeBuildKey', () => {
	it( 'changes with the packaged files', () => {
		expect( computeBuildKey( 'lib build', 'workflow' ) ).not.toBe(
			computeBuildKey( 'lib build readme.txt', 'workflow' )
		);
	} );

	it( 'changes with the workflow that builds and packages', () => {
		expect( computeBuildKey( 'lib build', 'workflow' ) ).not.toBe(
			computeBuildKey( 'lib build', 'workflow with a new step' )
		);
	} );

	it( 'is stable for the same inputs', () => {
		expect( computeBuildKey( 'lib build', 'workflow' ) ).toBe(
			computeBuildKey( 'lib build', 'workflow' )
		);
	} );
} );

describe( 'resolveShards', () => {
	const specs = fs
		.readdirSync(
			path.join( __dirname, '../../../test/performance/specs' )
		)
		.filter( ( file ) => file.endsWith( '.spec.js' ) )
		.map( ( file ) => path.basename( file, '.spec.js' ) );

	it( 'covers every spec file in the repository exactly once', () => {
		const shards = resolveShards( specs );
		expect(
			shards.flatMap( ( { suites } ) => suites.split( ',' ) ).sort()
		).toEqual( [ ...specs ].sort() );
	} );

	it( 'fails when a spec is not assigned to a shard', () => {
		expect( () => resolveShards( [ ...specs, 'new-suite' ] ) ).toThrow(
			'Missing: new-suite'
		);
	} );

	it( 'fails when a shard lists a spec that does not exist', () => {
		expect( () => resolveShards( specs.slice( 1 ) ) ).toThrow(
			`Unknown: ${ specs[ 0 ] }`
		);
	} );
} );
