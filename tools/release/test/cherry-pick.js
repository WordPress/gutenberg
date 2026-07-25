/**
 * External dependencies
 */
const fs = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );

/**
 * Internal dependencies
 */
const {
	cherryPickAll,
	cherryPickOne,
	isGhVersionSupported,
	parseGhVersion,
	MINIMUM_GH_VERSION,
} = require( '../cherry-pick.mjs' );

const LOCAL_AUTHOR = {
	name: 'Marco Ciampini',
	email: 'marco@example.com',
};

const OTHER_AUTHOR = {
	name: 'Other Author',
	email: 'other@example.com',
};

let repository;

function git( args, options = {} ) {
	const result = spawnSync( 'git', args, {
		cwd: repository,
		encoding: 'utf8',
		env: {
			...process.env,
			...options.env,
		},
	} );

	if ( ! options.allowFailure && result.status !== 0 ) {
		throw new Error( result.stderr );
	}

	return result;
}

function commitFile( file, contents, message, author = LOCAL_AUTHOR ) {
	fs.writeFileSync( path.join( repository, file ), contents );
	git( [ 'add', file ] );
	git( [ 'commit', '-m', message ], {
		env: {
			GIT_AUTHOR_NAME: author.name,
			GIT_AUTHOR_EMAIL: author.email,
		},
	} );
	return git( [ 'rev-parse', 'HEAD' ] ).stdout.trim();
}

function initializeRepository() {
	repository = fs.mkdtempSync(
		path.join( os.tmpdir(), 'gutenberg-cherry-pick-test-' )
	);
	git( [ 'init', '--initial-branch=target' ] );
	git( [ 'config', 'user.name', LOCAL_AUTHOR.name ] );
	git( [ 'config', 'user.email', LOCAL_AUTHOR.email ] );
	commitFile( 'base.txt', 'base\n', 'Base' );
}

describe( 'GitHub CLI version requirement', () => {
	it( 'extracts the version from the `gh --version` output', () => {
		expect(
			parseGhVersion(
				'gh version 2.96.0 (2026-07-02)\nhttps://github.com/cli/cli/releases/tag/v2.96.0\n'
			)
		).toBe( '2.96.0' );
	} );

	it( 'returns null when the output carries no version', () => {
		expect( parseGhVersion( '' ) ).toBeNull();
	} );

	it( 'rejects versions that predate the `gh pr edit` fix', () => {
		// 2.54.0 queries the sunset Projects (classic) API and always fails.
		expect( isGhVersionSupported( '2.54.0' ) ).toBe( false );
	} );

	it( 'accepts the minimum version and newer ones', () => {
		expect( isGhVersionSupported( MINIMUM_GH_VERSION ) ).toBe( true );
		expect( isGhVersionSupported( '2.96.0' ) ).toBe( true );
		// A lexical comparison would rank this below "2.73.0".
		expect( isGhVersionSupported( '2.100.0' ) ).toBe( true );
	} );

	it( 'rejects a missing version', () => {
		expect( isGhVersionSupported( null ) ).toBe( false );
	} );
} );

describe( 'release cherry-picks', () => {
	beforeEach( initializeRepository );

	afterEach( () => {
		fs.rmSync( repository, { force: true, recursive: true } );
	} );

	it( 'records a successful cherry-pick whose output includes an Author line', () => {
		git( [ 'switch', '-c', 'source' ] );
		const commit = commitFile(
			'change.txt',
			'change\n',
			'Different author',
			OTHER_AUTHOR
		);
		git( [ 'switch', 'target' ] );

		expect( cherryPickOne( commit, repository ) ).toBe(
			git( [ 'rev-parse', '--short', 'HEAD' ] ).stdout.trim()
		);
		expect( git( [ 'log', '-1', '--format=%s' ] ).stdout.trim() ).toBe(
			'Different author'
		);
	} );

	it( 'records a successful cherry-pick whose output omits an Author line', () => {
		git( [ 'switch', '-c', 'source' ] );
		const commit = commitFile(
			'change.txt',
			'change\n',
			'Matching author'
		);
		git( [ 'switch', 'target' ] );

		expect( cherryPickOne( commit, repository ) ).toBe(
			git( [ 'rev-parse', '--short', 'HEAD' ] ).stdout.trim()
		);
		expect( git( [ 'log', '-1', '--format=%s' ] ).stdout.trim() ).toBe(
			'Matching author'
		);
	} );

	it( 'restores the pre-attempt state after a conflicting cherry-pick', () => {
		git( [ 'switch', '-c', 'source' ] );
		const commit = commitFile(
			'base.txt',
			'source\n',
			'Conflicting source change'
		);
		git( [ 'switch', 'target' ] );
		commitFile( 'base.txt', 'target\n', 'Conflicting target change' );
		const headBeforeCherryPick = git( [
			'rev-parse',
			'HEAD',
		] ).stdout.trim();

		expect( () => cherryPickOne( commit, repository ) ).toThrow(
			/CONFLICT|could not apply/
		);
		expect( git( [ 'rev-parse', 'HEAD' ] ).stdout.trim() ).toBe(
			headBeforeCherryPick
		);
		expect(
			fs.readFileSync( path.join( repository, 'base.txt' ), 'utf8' )
		).toBe( 'target\n' );
		expect( git( [ 'status', '--porcelain' ] ).stdout ).toBe( '' );
		expect(
			git( [ 'rev-parse', '--verify', '--quiet', 'CHERRY_PICK_HEAD' ], {
				allowFailure: true,
			} ).status
		).not.toBe( 0 );
	} );

	it( 'preserves unrelated work when cleaning up a conflict', () => {
		commitFile( 'unrelated.txt', 'committed\n', 'Add unrelated file' );
		git( [ 'switch', '-c', 'source' ] );
		const commit = commitFile(
			'base.txt',
			'source\n',
			'Conflicting source change'
		);
		git( [ 'switch', 'target' ] );
		commitFile( 'base.txt', 'target\n', 'Conflicting target change' );
		const headBeforeCherryPick = git( [
			'rev-parse',
			'HEAD',
		] ).stdout.trim();
		fs.writeFileSync(
			path.join( repository, 'unrelated.txt' ),
			'local work\n'
		);

		expect( () => cherryPickOne( commit, repository ) ).toThrow(
			/CONFLICT|could not apply/
		);
		expect( git( [ 'rev-parse', 'HEAD' ] ).stdout.trim() ).toBe(
			headBeforeCherryPick
		);
		expect(
			fs.readFileSync( path.join( repository, 'unrelated.txt' ), 'utf8' )
		).toBe( 'local work\n' );
		expect( git( [ 'status', '--porcelain' ] ).stdout ).toBe(
			' M unrelated.txt\n'
		);
		expect(
			git( [ 'rev-parse', '--verify', '--quiet', 'CHERRY_PICK_HEAD' ], {
				allowFailure: true,
			} ).status
		).not.toBe( 0 );
	} );

	it( 'does not retry a successful cherry-pick that omits an Author line', () => {
		git( [ 'switch', '-c', 'matching-author' ] );
		const matchingAuthorCommit = commitFile(
			'matching-author.txt',
			'matching\n',
			'Matching author'
		);
		git( [ 'switch', 'target' ] );
		git( [ 'switch', '-c', 'different-author' ] );
		const differentAuthorCommit = commitFile(
			'different-author.txt',
			'different\n',
			'Different author',
			OTHER_AUTHOR
		);
		git( [ 'switch', 'target' ] );

		const [ successes, failures ] = cherryPickAll(
			[
				{
					mergeCommitHash: matchingAuthorCommit,
					number: 1,
					title: 'Matching author',
				},
				{
					mergeCommitHash: differentAuthorCommit,
					number: 2,
					title: 'Different author',
				},
			],
			repository
		);
		expect( console ).toHaveLogged();

		expect( successes.map( ( { number } ) => number ) ).toEqual( [ 1, 2 ] );
		expect( failures ).toEqual( [] );
		expect(
			git( [ 'log', '--format=%s' ] )
				.stdout.split( '\n' )
				.filter( ( subject ) => subject === 'Matching author' )
		).toHaveLength( 1 );
	} );

	it( 'retries a failed cherry-pick after another commit succeeds', () => {
		git( [ 'switch', '-c', 'source' ] );
		const prerequisiteCommit = commitFile(
			'base.txt',
			'middle\n',
			'Prerequisite',
			OTHER_AUTHOR
		);
		const dependentCommit = commitFile(
			'base.txt',
			'final\n',
			'Dependent',
			OTHER_AUTHOR
		);
		git( [ 'switch', 'target' ] );

		const [ successes, failures ] = cherryPickAll(
			[
				{
					mergeCommitHash: dependentCommit,
					number: 2,
					title: 'Dependent',
				},
				{
					mergeCommitHash: prerequisiteCommit,
					number: 1,
					title: 'Prerequisite',
				},
			],
			repository
		);
		expect( console ).toHaveLogged();

		expect( successes.map( ( { number } ) => number ) ).toEqual( [ 1, 2 ] );
		expect( failures ).toEqual( [] );
		expect(
			fs.readFileSync( path.join( repository, 'base.txt' ), 'utf8' )
		).toBe( 'final\n' );
	} );
} );
