import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const logger = require( '../../lib/logger' );
const SimpleGit = require( 'simple-git' );
let {
	backportCommitsToBranch,
	deleteNpmReleasePreparedCommit,
	finalizePreparedNpmRelease,
	getNpmReleasePackages,
	getNpmReleaseGitRecoveryCommands,
	getRemoteBranchSha,
	getRemoteTagShas,
	getTagPushCommands,
	getTagRefspec,
	prepareNpmRelease,
	getNpmReleasePreparedRefs,
	getNpmReleasePreparedPluginBranch,
	getNpmReleasePreparedState,
	isNpmReleaseGitMetadataPublished,
	publishPackagesToNpm,
	publishPreparedPackagesToNpm,
	publishVersionedPackagesToNpm,
	pushNpmReleasePreparedCommit,
	pushNpmReleaseGitMetadata,
	runNpmPublishPreflight,
	runNpmReleasePhase,
	runPackagesRelease,
	resumePreparedNpmRelease,
	verifyRemotePackageTags,
} = {};

beforeAll( () => {
	logger.log = console.log;
	( {
		backportCommitsToBranch,
		deleteNpmReleasePreparedCommit,
		finalizePreparedNpmRelease,
		getNpmReleasePackages,
		getNpmReleaseGitRecoveryCommands,
		getRemoteBranchSha,
		getRemoteTagShas,
		getTagPushCommands,
		getTagRefspec,
		prepareNpmRelease,
		getNpmReleasePreparedRefs,
		getNpmReleasePreparedPluginBranch,
		getNpmReleasePreparedState,
		isNpmReleaseGitMetadataPublished,
		publishPackagesToNpm,
		publishPreparedPackagesToNpm,
		publishVersionedPackagesToNpm,
		pushNpmReleasePreparedCommit,
		pushNpmReleaseGitMetadata,
		runNpmPublishPreflight,
		runNpmReleasePhase,
		runPackagesRelease,
		resumePreparedNpmRelease,
		verifyRemotePackageTags,
	} = require( '../packages' ) );
} );

describe( 'prepareNpmRelease', () => {
	it.each( [
		[ 'latest', 'release/23.5' ],
		[ 'next', 'trunk' ],
		[ 'bugfix', undefined ],
		[ 'wp', undefined ],
	] )(
		'prepares a %s release',
		async ( releaseType, expectedPluginReleaseBranch ) => {
			const config = {
				gitWorkingDirectoryPath: '/repo',
				releaseType,
			};
			const checkoutNpmReleaseBranchFn = vi.fn();
			const findPluginReleaseBranchNameFn = vi
				.fn()
				.mockResolvedValue( 'release/23.5' );
			const runNpmReleaseBranchSyncStepFn = vi.fn();
			const updatePackagesFn = vi
				.fn()
				.mockResolvedValue( 'changelog-sha' );

			await expect(
				prepareNpmRelease( config, {
					checkoutNpmReleaseBranchFn,
					findPluginReleaseBranchNameFn,
					runNpmReleaseBranchSyncStepFn,
					updatePackagesFn,
				} )
			).resolves.toEqual( {
				changelogCommit: 'changelog-sha',
				pluginReleaseBranch: expectedPluginReleaseBranch,
			} );
			expect( findPluginReleaseBranchNameFn.mock.calls ).toEqual(
				releaseType === 'latest' ? [ [ '/repo' ] ] : []
			);
			expect( checkoutNpmReleaseBranchFn.mock.calls ).toEqual(
				[ 'bugfix', 'wp' ].includes( releaseType ) ? [ [ config ] ] : []
			);
			expect( runNpmReleaseBranchSyncStepFn.mock.calls ).toEqual(
				expectedPluginReleaseBranch
					? [ [ expectedPluginReleaseBranch, config ] ]
					: []
			);
			expect( updatePackagesFn ).toHaveBeenCalledTimes( 1 );
			expect( updatePackagesFn ).toHaveBeenCalledWith( config );
		}
	);
} );

describe( 'finalizePreparedNpmRelease', () => {
	it.each( [
		[ 'latest', 'release/23.5', [ 'trunk', 'release/23.5' ] ],
		[ 'bugfix', undefined, [ 'trunk' ] ],
		[ 'next', undefined, [] ],
		[ 'wp', undefined, [] ],
	] )(
		'finalizes a %s release',
		async ( releaseType, pluginReleaseBranch, expectedBranches ) => {
			const config = { releaseType };
			const backportCommitsToBranchFn = vi.fn();
			const commits = [ 'changelog-sha', 'publish-sha' ];

			await finalizePreparedNpmRelease(
				config,
				{
					changelogCommit: commits[ 0 ],
					pluginReleaseBranch,
					publishCommit: commits[ 1 ],
				},
				{ backportCommitsToBranchFn }
			);

			expect( backportCommitsToBranchFn.mock.calls ).toEqual(
				expectedBranches.map( ( branch ) => [
					branch,
					commits,
					config,
				] )
			);
		}
	);
} );

describe( 'publishPreparedPackagesToNpm', () => {
	it( 'publishes with the plugin branch selected during preparation', async () => {
		const config = { releaseType: 'latest' };
		const publishPackagesToNpmFn = vi.fn();

		await publishPreparedPackagesToNpm(
			config,
			{ pluginReleaseBranch: 'release/23.9' },
			{ publishPackagesToNpmFn }
		);

		expect( publishPackagesToNpmFn ).toHaveBeenCalledWith( {
			...config,
			pluginReleaseBranch: 'release/23.9',
		} );
	} );
} );

describe( 'runPackagesRelease', () => {
	it( 'runs the release lifecycle in order', async () => {
		const config = {
			gitWorkingDirectoryPath: '/repo',
			interactive: false,
			npmReleaseBranch: 'wp/latest',
		};
		const releaseState = { changelogCommit: 'changelog-sha' };
		const prepareNpmReleaseFn = vi.fn().mockResolvedValue( releaseState );
		const publishPreparedPackagesToNpmFn = vi
			.fn()
			.mockResolvedValue( 'publish-sha' );
		const resumePreparedNpmReleaseFn = vi.fn().mockResolvedValue( null );
		const finalizePreparedNpmReleaseFn = vi.fn();
		const deletePreparedCommitFn = vi.fn();

		await runPackagesRelease( config, [], {
			deletePreparedCommitFn,
			finalizePreparedNpmReleaseFn,
			prepareNpmReleaseFn,
			publishPreparedPackagesToNpmFn,
			resumePreparedNpmReleaseFn,
		} );

		expect( resumePreparedNpmReleaseFn ).toHaveBeenCalledWith( config );
		expect( prepareNpmReleaseFn ).toHaveBeenCalledTimes( 1 );
		expect( prepareNpmReleaseFn ).toHaveBeenCalledWith( config );
		expect( publishPreparedPackagesToNpmFn ).toHaveBeenCalledTimes( 1 );
		expect( publishPreparedPackagesToNpmFn ).toHaveBeenCalledWith(
			config,
			releaseState
		);
		expect( finalizePreparedNpmReleaseFn ).toHaveBeenCalledTimes( 1 );
		expect( finalizePreparedNpmReleaseFn ).toHaveBeenCalledWith( config, {
			changelogCommit: 'changelog-sha',
			publishCommit: 'publish-sha',
		} );
		expect(
			prepareNpmReleaseFn.mock.invocationCallOrder[ 0 ]
		).toBeLessThan(
			publishPreparedPackagesToNpmFn.mock.invocationCallOrder[ 0 ]
		);
		expect(
			publishPreparedPackagesToNpmFn.mock.invocationCallOrder[ 0 ]
		).toBeLessThan(
			finalizePreparedNpmReleaseFn.mock.invocationCallOrder[ 0 ]
		);
		expect(
			finalizePreparedNpmReleaseFn.mock.invocationCallOrder[ 0 ]
		).toBeLessThan( deletePreparedCommitFn.mock.invocationCallOrder[ 0 ] );
		expect( console ).toHaveLogged();
	} );

	it( 'keeps prepared state when finalization fails', async () => {
		const config = {
			gitWorkingDirectoryPath: '/repo',
			interactive: false,
			npmReleaseBranch: 'wp/latest',
		};
		const deletePreparedCommitFn = vi.fn();
		const finalizePreparedNpmReleaseFn = vi
			.fn()
			.mockRejectedValue( new Error( 'backport failed' ) );

		await expect(
			runPackagesRelease( config, [], {
				deletePreparedCommitFn,
				finalizePreparedNpmReleaseFn,
				prepareNpmReleaseFn: vi
					.fn()
					.mockResolvedValue( { changelogCommit: 'changelog-sha' } ),
				publishPreparedPackagesToNpmFn: vi
					.fn()
					.mockResolvedValue( 'publish-sha' ),
				resumePreparedNpmReleaseFn: vi.fn().mockResolvedValue( null ),
			} )
		).rejects.toThrow( 'backport failed' );

		expect( deletePreparedCommitFn ).not.toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );

	it( 'resumes a prepared release before syncing or updating the release branch', async () => {
		const config = {
			gitWorkingDirectoryPath: '/repo',
			interactive: false,
			npmReleaseBranch: 'wp/latest',
		};
		const releaseState = {
			changelogCommit: 'changelog-sha',
			pluginReleaseBranch: 'release/23.9',
			publishCommit: 'prepared-sha',
		};
		const resumePreparedNpmReleaseFn = vi
			.fn()
			.mockResolvedValue( releaseState );
		const prepareNpmReleaseFn = vi.fn();
		const publishPreparedPackagesToNpmFn = vi.fn();
		const finalizePreparedNpmReleaseFn = vi.fn();
		const deletePreparedCommitFn = vi.fn();

		await runPackagesRelease( config, [], {
			deletePreparedCommitFn,
			finalizePreparedNpmReleaseFn,
			prepareNpmReleaseFn,
			publishPreparedPackagesToNpmFn,
			resumePreparedNpmReleaseFn,
		} );

		expect( resumePreparedNpmReleaseFn ).toHaveBeenCalledWith( config );
		expect( prepareNpmReleaseFn ).not.toHaveBeenCalled();
		expect( publishPreparedPackagesToNpmFn ).not.toHaveBeenCalled();
		expect( finalizePreparedNpmReleaseFn ).toHaveBeenCalledWith(
			config,
			releaseState
		);
		expect( deletePreparedCommitFn ).toHaveBeenCalledWith(
			'/repo',
			'wp/latest'
		);
		expect( console ).toHaveLogged();
	} );
} );

describe( 'getNpmReleasePackages', () => {
	it( 'returns public packages tagged at HEAD', async () => {
		const files = [
			'/repo/packages/blocks/package.json',
			'/repo/packages/a11y/package.json',
			'/repo/packages/private/package.json',
			'/repo/packages/untagged/package.json',
		];
		const packageJsonByPath = {
			'/repo/packages/blocks/package.json': {
				name: '@wordpress/blocks',
				version: '2.0.0',
			},
			'/repo/packages/a11y/package.json': {
				name: '@wordpress/a11y',
				version: '1.0.0',
			},
			'/repo/packages/private/package.json': {
				name: '@wordpress/private',
				private: true,
				version: '3.0.0',
			},
			'/repo/packages/untagged/package.json': {
				name: '@wordpress/untagged',
				version: '4.0.0',
			},
		};
		const git = {
			raw: vi
				.fn()
				.mockResolvedValue(
					[
						'@wordpress/blocks@2.0.0',
						'@wordpress/a11y@1.0.0',
						'@wordpress/private@3.0.0',
					].join( '\n' )
				),
		};

		await expect(
			getNpmReleasePackages( '/repo', {
				git,
				globFn: vi.fn().mockResolvedValue( files ),
				readJSON: ( file ) => packageJsonByPath[ file ],
			} )
		).resolves.toEqual( [
			{
				name: '@wordpress/a11y',
				tagName: '@wordpress/a11y@1.0.0',
				version: '1.0.0',
			},
			{
				name: '@wordpress/blocks',
				tagName: '@wordpress/blocks@2.0.0',
				version: '2.0.0',
			},
		] );
		expect( git.raw ).toHaveBeenCalledWith( 'tag', '--points-at', 'HEAD' );
	} );
} );

describe( 'getTagRefspec', () => {
	it( 'returns a fully qualified package tag refspec', () => {
		expect( getTagRefspec( '@wordpress/a11y@4.50.0' ) ).toBe(
			'refs/tags/@wordpress/a11y@4.50.0:refs/tags/@wordpress/a11y@4.50.0'
		);
	} );
} );

describe( 'getTagPushCommands', () => {
	it( 'quotes fully qualified tag refspecs', () => {
		expect(
			getTagPushCommands( [
				'@wordpress/a11y@4.50.0',
				'@wordpress/blocks@14.20.0',
			] )
		).toEqual( [
			[
				'git push origin \\',
				'  "refs/tags/@wordpress/a11y@4.50.0:refs/tags/@wordpress/a11y@4.50.0" \\',
				'  "refs/tags/@wordpress/blocks@14.20.0:refs/tags/@wordpress/blocks@14.20.0"',
			].join( '\n' ),
		] );
	} );
} );

describe( 'getNpmReleaseGitRecoveryCommands', () => {
	it( 'includes branch, tag push, and tag verification commands', () => {
		const commands = getNpmReleaseGitRecoveryCommands( {
			npmReleaseBranch: 'wp/latest',
			packageTags: [ '@wordpress/a11y@4.50.0' ],
			publishCommit: 'abc123',
		} );

		expect( commands ).toContain( 'git push origin \\' );
		expect( commands ).toContain(
			'"refs/tags/@wordpress/a11y@4.50.0:refs/tags/@wordpress/a11y@4.50.0"'
		);
		expect( commands ).toContain(
			'git push origin "abc123:refs/heads/wp/latest"'
		);
		expect( commands ).toContain(
			'git ls-remote --heads origin "refs/heads/wp/latest"'
		);
		expect( commands ).toContain(
			'git ls-remote --tags origin "refs/tags/@wordpress/a11y@4.50.0" "refs/tags/@wordpress/a11y@4.50.0^{}"'
		);
	} );
} );

describe( 'getRemoteBranchSha', () => {
	it( 'returns the exact remote branch ref SHA', async () => {
		const git = {
			raw: vi
				.fn()
				.mockResolvedValue(
					[
						'wrong-sha\trefs/heads/backport/wp/latest',
						'expected-sha\trefs/heads/wp/latest',
					].join( '\n' )
				),
		};

		await expect(
			getRemoteBranchSha( '/repo', 'wp/latest', { git } )
		).resolves.toBe( 'expected-sha' );
		expect( git.raw ).toHaveBeenCalledWith(
			'ls-remote',
			'--heads',
			'origin',
			'refs/heads/wp/latest'
		);
	} );
} );

describe( 'getRemoteTagShas', () => {
	it( 'fetches tag refs in one call and prefers peeled SHAs', async () => {
		const git = {
			raw: vi
				.fn()
				.mockResolvedValue(
					[
						'direct-a11y\trefs/tags/@wordpress/a11y@4.50.0',
						'peeled-a11y\trefs/tags/@wordpress/a11y@4.50.0^{}',
						'direct-blocks\trefs/tags/@wordpress/blocks@14.20.0',
					].join( '\n' )
				),
		};

		const result = await getRemoteTagShas(
			'/repo',
			[ '@wordpress/a11y@4.50.0', '@wordpress/blocks@14.20.0' ],
			{ git }
		);

		expect( git.raw ).toHaveBeenCalledWith(
			'ls-remote',
			'--tags',
			'origin',
			'refs/tags/@wordpress/a11y@4.50.0',
			'refs/tags/@wordpress/a11y@4.50.0^{}',
			'refs/tags/@wordpress/blocks@14.20.0',
			'refs/tags/@wordpress/blocks@14.20.0^{}'
		);
		expect( result.get( '@wordpress/a11y@4.50.0' ) ).toBe( 'peeled-a11y' );
		expect( result.get( '@wordpress/blocks@14.20.0' ) ).toBe(
			'direct-blocks'
		);
	} );
} );

describe( 'verifyRemotePackageTags', () => {
	it( 'throws when a remote tag is missing or points to another commit', async () => {
		await expect(
			verifyRemotePackageTags(
				{
					gitWorkingDirectoryPath: '/repo',
					packageTags: [
						'@wordpress/a11y@4.50.0',
						'@wordpress/blocks@14.20.0',
					],
					publishCommit: 'expected-sha',
				},
				{
					getRemoteTagShasFn: vi.fn().mockResolvedValue(
						new Map( [
							[ '@wordpress/a11y@4.50.0', 'expected-sha' ],
							[ '@wordpress/blocks@14.20.0', 'other-sha' ],
						] )
					),
				}
			)
		).rejects.toThrow(
			'@wordpress/blocks@14.20.0: expected expected-sha, got other-sha'
		);
	} );
} );

describe( 'runNpmPublishPreflight', () => {
	// npm whoami output, intentionally padded to verify it is trimmed.
	const WHOAMI = { stdout: 'wp-user\n' };

	it( 'verifies npm authentication before checking registry state', async () => {
		const commandFn = vi
			.fn()
			.mockResolvedValueOnce( WHOAMI )
			.mockRejectedValueOnce( {
				stderr: 'npm ERR! code E404',
			} );

		await expect(
			runNpmPublishPreflight(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					publishCommit: 'publish-sha',
					releasePackages: [
						{ name: '@wordpress/a11y', version: '4.50.0' },
					],
				},
				{ commandFn }
			)
		).resolves.toEqual( [] );

		expect( commandFn ).toHaveBeenNthCalledWith( 1, 'npm whoami', {
			cwd: '/repo',
			stdio: 'pipe',
		} );
		expect( commandFn ).toHaveBeenNthCalledWith(
			2,
			'npm view @wordpress/a11y@4.50.0 version gitHead dist-tags --json',
			{ cwd: '/repo', stdio: 'pipe' }
		);
		expect( console ).toHaveLogged();
	} );

	it( 'fails without checking registry state when npm authentication fails', async () => {
		const commandFn = vi.fn().mockRejectedValueOnce(
			Object.assign( new Error( 'Command failed: npm whoami' ), {
				stderr: 'npm ERR! code ENEEDAUTH',
			} )
		);

		await expect(
			runNpmPublishPreflight(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					publishCommit: 'publish-sha',
					releasePackages: [
						{ name: '@wordpress/a11y', version: '4.50.0' },
					],
				},
				{ commandFn }
			)
		).rejects.toThrow( 'Command failed: npm whoami' );
		expect( commandFn ).toHaveBeenCalledTimes( 1 );
		expect( console ).toHaveLogged();
	} );

	it( 'accepts a published version from the prepared commit with the expected dist-tag', async () => {
		const commandFn = vi
			.fn()
			.mockResolvedValueOnce( WHOAMI )
			.mockResolvedValueOnce( {
				stdout: '{"version":"4.50.0","gitHead":"publish-sha","dist-tags":{"latest":"4.50.0"}}',
			} );

		await expect(
			runNpmPublishPreflight(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					publishCommit: 'publish-sha',
					releasePackages: [
						{ name: '@wordpress/a11y', version: '4.50.0' },
					],
				},
				{ commandFn }
			)
		).resolves.toEqual( [ '@wordpress/a11y' ] );
		expect( commandFn ).toHaveBeenCalledTimes( 2 );
		expect( console ).toHaveLogged();
	} );

	it( 'fails when a published version came from another commit', async () => {
		const commandFn = vi
			.fn()
			.mockResolvedValueOnce( WHOAMI )
			.mockResolvedValueOnce( {
				stdout: '{"version":"4.50.0","gitHead":"other-sha","dist-tags":{"latest":"4.50.0"}}',
			} );

		await expect(
			runNpmPublishPreflight(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					publishCommit: 'publish-sha',
					releasePackages: [
						{ name: '@wordpress/a11y', version: '4.50.0' },
					],
				},
				{ commandFn }
			)
		).rejects.toThrow(
			'@wordpress/a11y@4.50.0 exists in the npm registry with gitHead other-sha, expected publish-sha.'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'fails with an actionable error when a published version has no gitHead', async () => {
		const commandFn = vi
			.fn()
			.mockResolvedValueOnce( WHOAMI )
			.mockResolvedValueOnce( {
				stdout: '{"version":"4.50.0","dist-tags":{"latest":"4.50.0"}}',
			} );

		await expect(
			runNpmPublishPreflight(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					publishCommit: 'publish-sha',
					releasePackages: [
						{ name: '@wordpress/a11y', version: '4.50.0' },
					],
				},
				{ commandFn }
			)
		).rejects.toThrow(
			'@wordpress/a11y@4.50.0 exists in the npm registry with gitHead nothing, expected publish-sha.'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'fails when a published version has the wrong dist-tag', async () => {
		const commandFn = vi
			.fn()
			.mockResolvedValueOnce( WHOAMI )
			.mockResolvedValueOnce( {
				stdout: '{"version":"4.50.0","gitHead":"publish-sha","dist-tags":{"latest":"4.49.0"}}',
			} );

		await expect(
			runNpmPublishPreflight(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					publishCommit: 'publish-sha',
					releasePackages: [
						{ name: '@wordpress/a11y', version: '4.50.0' },
					],
				},
				{ commandFn }
			)
		).rejects.toThrow(
			'@wordpress/a11y@4.50.0 exists in the npm registry, but dist-tag "latest" points to 4.49.0. If another release moved the dist-tag, this prepared release is not safe to resume.'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'fails when the registry returns a different version', async () => {
		const commandFn = vi
			.fn()
			.mockResolvedValueOnce( WHOAMI )
			.mockResolvedValueOnce( {
				stdout: '{"version":"4.49.0","gitHead":"publish-sha","dist-tags":{"latest":"4.49.0"}}',
			} );

		await expect(
			runNpmPublishPreflight(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					publishCommit: 'publish-sha',
					releasePackages: [
						{ name: '@wordpress/a11y', version: '4.50.0' },
					],
				},
				{ commandFn }
			)
		).rejects.toThrow(
			'Expected npm registry lookup for @wordpress/a11y@4.50.0 to return version 4.50.0, got 4.49.0.'
		);
		expect( console ).toHaveLogged();
	} );
} );

describe( 'runNpmReleasePhase', () => {
	it( 'retries a failed phase before surfacing success', async () => {
		const task = vi
			.fn()
			.mockRejectedValueOnce( new Error( 'transient failure' ) )
			.mockResolvedValueOnce();
		const wait = vi.fn();

		await runNpmReleasePhase( 'Package tag push', task, { wait } );

		expect( task ).toHaveBeenCalledTimes( 2 );
		expect( wait ).toHaveBeenCalledWith( 5000 );
		expect( console ).toHaveLogged();
	} );
} );

describe( 'pushNpmReleaseGitMetadata', () => {
	it( 'pushes the branch before pushing and verifying package tags', async () => {
		const git = { raw: vi.fn().mockResolvedValue() };
		const runPhase = vi.fn( async ( _label, task ) => task() );
		const verifyRemoteNpmReleaseBranchFn = vi.fn();
		const verifyRemotePackageTagsFn = vi.fn();

		await pushNpmReleaseGitMetadata(
			{
				gitWorkingDirectoryPath: '/repo',
				npmReleaseBranch: 'wp/latest',
				packageTags: [
					'@wordpress/a11y@4.50.0',
					'@wordpress/blocks@14.20.0',
				],
				publishCommit: 'publish-sha',
			},
			{
				git,
				runPhase,
				verifyRemoteNpmReleaseBranchFn,
				verifyRemotePackageTagsFn,
			}
		);

		expect( runPhase.mock.calls.map( ( [ label ] ) => label ) ).toEqual( [
			'Release branch push',
			'Release branch verification',
			'Package tag push',
			'Package tag verification',
		] );
		expect( git.raw ).toHaveBeenNthCalledWith(
			1,
			'push',
			'origin',
			'publish-sha:refs/heads/wp/latest'
		);
		expect( git.raw ).toHaveBeenNthCalledWith(
			2,
			'push',
			'origin',
			'refs/tags/@wordpress/a11y@4.50.0:refs/tags/@wordpress/a11y@4.50.0',
			'refs/tags/@wordpress/blocks@14.20.0:refs/tags/@wordpress/blocks@14.20.0'
		);
		expect( verifyRemoteNpmReleaseBranchFn ).toHaveBeenCalledWith( {
			gitWorkingDirectoryPath: '/repo',
			npmReleaseBranch: 'wp/latest',
			publishCommit: 'publish-sha',
		} );
		expect( verifyRemotePackageTagsFn ).toHaveBeenCalledWith( {
			gitWorkingDirectoryPath: '/repo',
			packageTags: [
				'@wordpress/a11y@4.50.0',
				'@wordpress/blocks@14.20.0',
			],
			publishCommit: 'publish-sha',
		} );
		expect( console ).toHaveLogged();
	} );
} );

describe( 'publishVersionedPackagesToNpm', () => {
	it( 'preflights, publishes from package, and pushes metadata', async () => {
		const commandFn = vi.fn().mockResolvedValue();
		const getNpmReleasePackagesFn = vi
			.fn()
			.mockResolvedValue( [
				{ name: '@wordpress/a11y', tagName: '@wordpress/a11y@4.50.0' },
			] );
		const runNpmPublishPreflightFn = vi
			.fn()
			.mockResolvedValueOnce( [] )
			.mockResolvedValueOnce( [ '@wordpress/a11y' ] );
		const pushNpmReleaseGitMetadataFn = vi.fn();
		const git = {
			raw: vi.fn().mockResolvedValue( '' ),
			revparse: vi.fn().mockResolvedValue( 'publish-sha' ),
		};

		await publishVersionedPackagesToNpm(
			{
				distTag: 'latest',
				gitWorkingDirectoryPath: '/repo',
				noVerifyAccessFlag: '--no-verify-access',
				npmReleaseBranch: 'wp/latest',
				pluginReleaseBranch: 'release/23.9',
				releaseType: 'latest',
				yesFlag: '--yes',
			},
			{
				commandFn,
				getNpmReleasePackagesFn,
				git,
				pushNpmReleaseGitMetadataFn,
				runNpmPublishPreflightFn,
			}
		);

		expect( getNpmReleasePackagesFn ).toHaveBeenCalledWith( '/repo' );
		expect( runNpmPublishPreflightFn ).toHaveBeenCalledWith( {
			distTag: 'latest',
			gitWorkingDirectoryPath: '/repo',
			publishCommit: 'publish-sha',
			releasePackages: [
				{ name: '@wordpress/a11y', tagName: '@wordpress/a11y@4.50.0' },
			],
		} );
		expect( commandFn ).toHaveBeenCalledWith(
			'npm exec --no -- lerna publish from-package --dist-tag latest --git-head publish-sha --yes --no-verify-access',
			{ cwd: '/repo', stdio: 'inherit' }
		);
		expect( pushNpmReleaseGitMetadataFn ).toHaveBeenCalledWith( {
			gitWorkingDirectoryPath: '/repo',
			npmReleaseBranch: 'wp/latest',
			packageTags: [ '@wordpress/a11y@4.50.0' ],
			publishCommit: 'publish-sha',
		} );
		expect(
			runNpmPublishPreflightFn.mock.invocationCallOrder[ 1 ]
		).toBeLessThan(
			pushNpmReleaseGitMetadataFn.mock.invocationCallOrder[ 0 ]
		);
		expect( console ).toHaveLogged();
	} );

	it( 'rechecks registry state before retrying from-package', async () => {
		const commandFn = vi
			.fn()
			.mockRejectedValueOnce( new Error( 'partial publish' ) )
			.mockResolvedValueOnce();
		const runNpmPublishPreflightFn = vi
			.fn()
			.mockResolvedValueOnce( [] )
			.mockResolvedValueOnce( [ '@wordpress/a11y' ] )
			.mockResolvedValueOnce( [
				'@wordpress/a11y',
				'@wordpress/blocks',
			] );
		const git = {
			raw: vi.fn().mockResolvedValue( '' ),
			revparse: vi.fn().mockResolvedValue( 'publish-sha' ),
			reset: vi.fn(),
		};

		await publishVersionedPackagesToNpm(
			{
				distTag: 'next',
				gitWorkingDirectoryPath: '/repo',
				noVerifyAccessFlag: '--no-verify-access',
				npmReleaseBranch: 'wp/next',
				yesFlag: '--yes',
			},
			{
				commandFn,
				getNpmReleasePackagesFn: vi.fn().mockResolvedValue( [
					{
						name: '@wordpress/a11y',
						tagName: '@wordpress/a11y@4.50.0-next.0',
					},
					{
						name: '@wordpress/blocks',
						tagName: '@wordpress/blocks@14.20.0-next.0',
					},
				] ),
				git,
				pushNpmReleaseGitMetadataFn: vi.fn(),
				runNpmPublishPreflightFn,
			}
		);

		expect( commandFn ).toHaveBeenCalledTimes( 2 );
		expect( runNpmPublishPreflightFn ).toHaveBeenCalledTimes( 3 );
		expect( git.reset ).toHaveBeenCalledWith( 'hard' );
		expect( git.reset.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			runNpmPublishPreflightFn.mock.invocationCallOrder[ 1 ]
		);
		expect( console ).toHaveLogged();
	} );

	it( 'skips Lerna when all package versions are already published', async () => {
		const commandFn = vi.fn();
		const git = {
			raw: vi.fn().mockResolvedValue( '' ),
			revparse: vi.fn().mockResolvedValue( 'publish-sha' ),
		};

		await publishVersionedPackagesToNpm(
			{
				distTag: 'latest',
				gitWorkingDirectoryPath: '/repo',
				noVerifyAccessFlag: '--no-verify-access',
				npmReleaseBranch: 'wp/latest',
				pluginReleaseBranch: 'release/23.9',
				releaseType: 'latest',
				yesFlag: '--yes',
			},
			{
				commandFn,
				getNpmReleasePackagesFn: vi.fn().mockResolvedValue( [
					{
						name: '@wordpress/a11y',
						tagName: '@wordpress/a11y@4.50.0',
					},
				] ),
				git,
				pushNpmReleaseGitMetadataFn: vi.fn(),
				runNpmPublishPreflightFn: vi
					.fn()
					.mockResolvedValue( [ '@wordpress/a11y' ] ),
			}
		);

		expect( commandFn ).not.toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );

	it( 'does not push metadata when final registry verification is incomplete', async () => {
		const commandFn = vi.fn().mockResolvedValue();
		const pushNpmReleaseGitMetadataFn = vi.fn();
		const runNpmPublishPreflightFn = vi.fn().mockResolvedValue( [] );
		const runPhase = vi.fn( async ( _label, task ) => task() );
		const git = {
			raw: vi.fn().mockResolvedValue( '' ),
			revparse: vi.fn().mockResolvedValue( 'publish-sha' ),
		};

		await expect(
			publishVersionedPackagesToNpm(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					noVerifyAccessFlag: '--no-verify-access',
					npmReleaseBranch: 'wp/latest',
					yesFlag: '--yes',
				},
				{
					commandFn,
					getNpmReleasePackagesFn: vi.fn().mockResolvedValue( [
						{
							name: '@wordpress/a11y',
							tagName: '@wordpress/a11y@4.50.0',
							version: '4.50.0',
						},
					] ),
					git,
					pushNpmReleaseGitMetadataFn,
					runNpmPublishPreflightFn,
					runPhase,
				}
			)
		).rejects.toThrow(
			'npm publication verification failed for @wordpress/a11y@4.50.0.'
		);

		expect( runNpmPublishPreflightFn ).toHaveBeenCalledTimes( 2 );
		expect( runPhase ).toHaveBeenCalledWith(
			'npm publication verification',
			expect.any( Function ),
			expect.objectContaining( { attempts: 18 } )
		);
		expect( pushNpmReleaseGitMetadataFn ).not.toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );

	it( 'retries final registry verification after propagation lag', async () => {
		const commandFn = vi.fn().mockResolvedValue();
		const pushNpmReleaseGitMetadataFn = vi.fn();
		const runNpmPublishPreflightFn = vi
			.fn()
			.mockResolvedValueOnce( [] )
			.mockResolvedValueOnce( [] )
			.mockResolvedValueOnce( [ '@wordpress/a11y' ] );
		const wait = vi.fn();
		const runPhase = ( label, task ) =>
			runNpmReleasePhase( label, task, { wait } );
		const git = {
			raw: vi.fn().mockResolvedValue( '' ),
			revparse: vi.fn().mockResolvedValue( 'publish-sha' ),
		};

		await publishVersionedPackagesToNpm(
			{
				distTag: 'latest',
				gitWorkingDirectoryPath: '/repo',
				noVerifyAccessFlag: '--no-verify-access',
				npmReleaseBranch: 'wp/latest',
				yesFlag: '--yes',
			},
			{
				commandFn,
				getNpmReleasePackagesFn: vi.fn().mockResolvedValue( [
					{
						name: '@wordpress/a11y',
						tagName: '@wordpress/a11y@4.50.0',
						version: '4.50.0',
					},
				] ),
				git,
				pushNpmReleaseGitMetadataFn,
				runNpmPublishPreflightFn,
				runPhase,
			}
		);

		expect( runNpmPublishPreflightFn ).toHaveBeenCalledTimes( 3 );
		expect( wait ).toHaveBeenCalledWith( 5000 );
		expect( pushNpmReleaseGitMetadataFn ).toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );
} );

describe( 'publishPackagesToNpm', () => {
	const getConfig = ( releaseType ) => ( {
		distTag: releaseType === 'next' ? 'next' : 'latest',
		gitWorkingDirectoryPath: '/repo',
		interactive: false,
		minimumVersionBump: 'patch',
		npmReleaseBranch: releaseType === 'next' ? 'wp/next' : 'wp/latest',
		releaseType,
	} );

	it.each( [
		[
			'latest',
			'npm exec --no -- lerna version patch --no-private --no-push --yes',
			'latest',
			'wp/latest',
		],
		[
			'next',
			'npm exec --no -- lerna version prepatch --preid next.v.',
			'next',
			'wp/next',
		],
		[
			'bugfix',
			'npm exec --no -- lerna version patch --no-private --no-push --yes',
			'latest',
			'wp/latest',
		],
		[
			'wp',
			'npm exec --no -- lerna version patch --no-private --no-push --yes',
			'wp-6.9',
			'wp/6.9',
		],
	] )(
		'routes %s releases through the shared metadata publishing path',
		async ( releaseType, versionCommand, distTag, npmReleaseBranch ) => {
			const commandFn = vi.fn().mockResolvedValue();
			const git = {
				raw: vi.fn().mockResolvedValue( '' ),
				revparse: vi
					.fn()
					.mockResolvedValueOnce( 'before-sha' )
					.mockResolvedValueOnce( 'after-sha' ),
			};
			const publishVersionedPackagesToNpmFn = vi.fn();
			const config = {
				...getConfig( releaseType ),
				distTag,
				npmReleaseBranch,
			};

			await publishPackagesToNpm( config, {
				commandFn,
				git,
				publishVersionedPackagesToNpmFn,
			} );

			expect( commandFn ).toHaveBeenCalledWith( 'npm ci', {
				cwd: '/repo',
			} );
			expect( commandFn ).toHaveBeenCalledWith( 'npm whoami', {
				cwd: '/repo',
				stdio: 'inherit',
			} );
			expect(
				commandFn.mock.calls.some(
					( [ command ] ) =>
						command.startsWith( versionCommand ) &&
						command.includes( '--no-push' )
				)
			).toBe( true );
			expect(
				commandFn.mock.calls.some( ( [ command ] ) =>
					command.includes( '--build-metadata' )
				)
			).toBe( false );
			expect( publishVersionedPackagesToNpmFn ).toHaveBeenCalledWith( {
				distTag,
				gitWorkingDirectoryPath: '/repo',
				noVerifyAccessFlag: '--no-verify-access',
				npmReleaseBranch,
				pluginReleaseBranch: undefined,
				releaseType,
				yesFlag: '--yes',
			} );
			expect( console ).toHaveLogged();
		}
	);
} );

describe( 'npm publication verification resumability', () => {
	it( 'only re-checks packages that are still missing from the registry', async () => {
		const releasePackages = [
			{ name: '@wordpress/a11y', version: '4.54.0', tagName: 'a' },
			{ name: '@wordpress/ui', version: '0.21.0', tagName: 'b' },
			{ name: '@wordpress/wordcount', version: '4.54.0', tagName: 'c' },
		];
		// First sweep confirms a11y only; later sweeps must not re-check it.
		const runNpmPublishPreflightFn = vi
			.fn()
			.mockResolvedValueOnce( [] )
			.mockResolvedValueOnce( [ '@wordpress/a11y' ] )
			.mockResolvedValueOnce( [ '@wordpress/wordcount' ] )
			.mockResolvedValueOnce( [ '@wordpress/ui' ] );

		await publishVersionedPackagesToNpm(
			{
				distTag: 'latest',
				gitWorkingDirectoryPath: '/repo',
				noVerifyAccessFlag: '--no-verify-access',
				npmReleaseBranch: 'wp/latest',
				yesFlag: '--yes',
			},
			{
				commandFn: vi.fn().mockResolvedValue(),
				getNpmReleasePackagesFn: vi
					.fn()
					.mockResolvedValue( releasePackages ),
				git: {
					revparse: vi.fn().mockResolvedValue( 'publish-sha' ),
					raw: vi.fn().mockResolvedValue( '' ),
				},
				pushNpmReleaseGitMetadataFn: vi.fn(),
				runNpmPublishPreflightFn,
				wait: vi.fn(),
			}
		);

		const sweeps = runNpmPublishPreflightFn.mock.calls
			.slice( 1 )
			.map( ( [ { releasePackages: pkgs } ] ) =>
				pkgs.map( ( { name } ) => name )
			);
		expect( sweeps[ 0 ] ).toEqual( [
			'@wordpress/a11y',
			'@wordpress/ui',
			'@wordpress/wordcount',
		] );
		expect( sweeps[ 1 ] ).toEqual( [
			'@wordpress/ui',
			'@wordpress/wordcount',
		] );
		expect( sweeps[ 2 ] ).toEqual( [ '@wordpress/ui' ] );
		expect( console ).toHaveLogged();
	} );

	it( 'reports only the packages still missing when the budget is exhausted', async () => {
		const releasePackages = [
			{ name: '@wordpress/a11y', version: '4.54.0', tagName: 'a' },
			{ name: '@wordpress/ui', version: '0.21.0', tagName: 'b' },
		];
		const runNpmPublishPreflightFn = vi
			.fn()
			.mockResolvedValueOnce( [] )
			.mockResolvedValue( [ '@wordpress/a11y' ] );

		await expect(
			publishVersionedPackagesToNpm(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					noVerifyAccessFlag: '--no-verify-access',
					npmReleaseBranch: 'wp/latest',
					yesFlag: '--yes',
				},
				{
					commandFn: vi.fn().mockResolvedValue(),
					getNpmReleasePackagesFn: vi
						.fn()
						.mockResolvedValue( releasePackages ),
					git: {
						revparse: vi.fn().mockResolvedValue( 'publish-sha' ),
						raw: vi.fn().mockResolvedValue( '' ),
					},
					pushNpmReleaseGitMetadataFn: vi.fn(),
					runNpmPublishPreflightFn,
					wait: vi.fn(),
				}
			)
		).rejects.toThrow( '@wordpress/ui@0.21.0' );
		expect( console ).toHaveLogged();
	} );

	it( 'backs off exponentially and caps the delay', async () => {
		const task = vi
			.fn()
			.mockRejectedValue( new Error( 'still propagating' ) );
		const wait = vi.fn();

		await expect(
			runNpmReleasePhase( 'npm publication verification', task, {
				attempts: 8,
				wait,
			} )
		).rejects.toThrow( 'still propagating' );

		const delays = wait.mock.calls.map( ( [ ms ] ) => ms );
		expect( delays ).toEqual( [
			5000, 10000, 20000, 40000, 80000, 120000, 120000,
		] );
		expect( console ).toHaveLogged();
	} );

	it( 'persists the prepared commit to a scratch ref before publishing', async () => {
		const commandFn = vi.fn().mockResolvedValue();
		const pushPreparedCommitFn = vi.fn();

		await publishVersionedPackagesToNpm(
			{
				distTag: 'latest',
				gitWorkingDirectoryPath: '/repo',
				noVerifyAccessFlag: '--no-verify-access',
				npmReleaseBranch: 'wp/latest',
				yesFlag: '--yes',
			},
			{
				commandFn,
				getNpmReleasePackagesFn: vi.fn().mockResolvedValue( [
					{
						name: '@wordpress/a11y',
						version: '4.54.0',
						tagName: 'a',
					},
				] ),
				git: {
					revparse: vi.fn().mockResolvedValue( 'publish-sha' ),
					raw: vi.fn().mockResolvedValue( '' ),
				},
				pushNpmReleaseGitMetadataFn: vi.fn(),
				pushPreparedCommitFn,
				runNpmPublishPreflightFn: vi
					.fn()
					.mockResolvedValueOnce( [] )
					.mockResolvedValueOnce( [ '@wordpress/a11y' ] ),
				wait: vi.fn(),
			}
		);

		expect( pushPreparedCommitFn.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( { publishCommit: 'publish-sha' } )
		);
		expect(
			pushPreparedCommitFn.mock.invocationCallOrder[ 0 ]
		).toBeLessThan( commandFn.mock.invocationCallOrder[ 0 ] );
		expect( console ).toHaveLogged();
	} );

	it( 'resumes finalization when git metadata is already published', async () => {
		const commandFn = vi.fn().mockResolvedValue();
		const publishVersionedPackagesToNpmFn = vi.fn();
		const git = {
			checkout: vi.fn(),
			fetch: vi.fn(),
			raw: vi.fn().mockResolvedValue( '' ),
		};

		await expect(
			resumePreparedNpmRelease(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					interactive: false,
					minimumVersionBump: 'minor',
					npmReleaseBranch: 'wp/latest',
					releaseType: 'latest',
				},
				{
					commandFn,
					getPreparedCommitFn: vi
						.fn()
						.mockResolvedValue( 'prepared-sha' ),
					getPreparedChangelogCommitFn: vi
						.fn()
						.mockResolvedValue( 'changelog-sha' ),
					getPreparedPluginReleaseBranchFn: vi
						.fn()
						.mockReturnValue( 'release/23.9' ),
					getPreparedStateFn: vi.fn().mockResolvedValue( {
						pluginReleaseBranch: 'release/23.9',
						releaseType: 'latest',
					} ),
					isGitMetadataPublishedFn: vi.fn().mockResolvedValue( true ),
					git,
					publishVersionedPackagesToNpmFn,
				}
			)
		).resolves.toEqual( {
			changelogCommit: 'changelog-sha',
			pluginReleaseBranch: 'release/23.9',
			publishCommit: 'prepared-sha',
		} );

		expect( git.checkout ).toHaveBeenCalledWith( 'prepared-sha' );
		expect( git.fetch ).toHaveBeenCalledWith( 'origin', 'wp/latest' );
		expect( publishVersionedPackagesToNpmFn ).not.toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );

	it( 'resumes from an existing prepared commit instead of re-versioning', async () => {
		const commandFn = vi.fn().mockResolvedValue();
		const publishVersionedPackagesToNpmFn = vi.fn();
		const git = {
			raw: vi
				.fn()
				.mockResolvedValue( 'changelog-sha\0Update changelog files' ),
			checkout: vi.fn(),
			fetch: vi.fn(),
		};

		await expect(
			resumePreparedNpmRelease(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					interactive: false,
					minimumVersionBump: 'minor',
					npmReleaseBranch: 'wp/latest',
					releaseType: 'latest',
				},
				{
					commandFn,
					getPreparedCommitFn: vi
						.fn()
						.mockResolvedValue( 'prepared-sha' ),
					getPreparedPluginReleaseBranchFn: vi
						.fn()
						.mockReturnValue( 'release/23.9' ),
					getPreparedStateFn: vi.fn().mockResolvedValue( {
						pluginReleaseBranch: 'release/23.9',
						releaseType: 'latest',
					} ),
					git,
					isGitMetadataPublishedFn: vi
						.fn()
						.mockResolvedValue( false ),
					publishVersionedPackagesToNpmFn,
					restorePreparedTagsFn: vi.fn(),
				}
			)
		).resolves.toEqual( {
			changelogCommit: 'changelog-sha',
			pluginReleaseBranch: 'release/23.9',
			publishCommit: 'prepared-sha',
		} );

		const lernaVersionCalls = commandFn.mock.calls.filter( ( [ cmd ] ) =>
			cmd.includes( 'lerna version' )
		);
		expect( lernaVersionCalls ).toHaveLength( 0 );
		expect( publishVersionedPackagesToNpmFn ).toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );
} );

describe( 'prepared release refs', () => {
	async function createGitFixture() {
		const root = await mkdtemp( join( tmpdir(), 'npm-release-refs-' ) );
		const remotePath = join( root, 'remote.git' );
		const repositoryPath = join( root, 'repository' );
		await mkdir( remotePath );
		await mkdir( repositoryPath );
		await SimpleGit( remotePath ).init( true );
		const git = SimpleGit( repositoryPath );
		await git.init();
		await git.addConfig( 'user.name', 'Release test' );
		await git.addConfig( 'user.email', 'release-test@example.com' );
		await git.addRemote( 'origin', remotePath );
		await writeFile( join( repositoryPath, 'package.json' ), '{}\n' );
		await git.add( 'package.json' );
		await git.commit( 'Initial commit' );
		return {
			cleanup: () => rm( root, { recursive: true, force: true } ),
			git,
			remote: SimpleGit( remotePath ),
			repositoryPath,
		};
	}

	it( 'recovers the plugin branch from the prepared checkout version', () => {
		expect(
			getNpmReleasePreparedPluginBranch( '/repo', {
				readJSON: vi.fn().mockReturnValue( {
					version: '23.9.0-rc.1',
				} ),
			} )
		).toBe( 'release/23.9' );
	} );

	it( 'namespaces the refs per release target', () => {
		expect( getNpmReleasePreparedRefs( 'wp/latest' ) ).toEqual(
			expect.objectContaining( {
				commit: 'refs/npm-release/wp-latest/commit',
				pluginReleaseBranch:
					'refs/npm-release/wp-latest/plugin-release-branch',
				releaseType: 'refs/npm-release/wp-latest/release-type',
				tags: 'refs/npm-release/wp-latest/tags',
			} )
		);
		// A concurrent release of a different target must not collide.
		expect( getNpmReleasePreparedRefs( 'wp/6.9' ).commit ).not.toEqual(
			getNpmReleasePreparedRefs( 'wp/latest' ).commit
		);
	} );

	it( 'reads the release route persisted with a prepared commit', async () => {
		const git = {
			raw: vi
				.fn()
				.mockResolvedValue(
					[
						'prepared-sha\trefs/npm-release/wp-latest/release-type/latest',
						'prepared-sha\trefs/npm-release/wp-latest/plugin-release-branch/release/23.9',
					].join( '\n' )
				),
		};

		await expect(
			getNpmReleasePreparedState( '/repo', 'wp/latest', 'prepared-sha', {
				git,
			} )
		).resolves.toEqual( {
			pluginReleaseBranch: 'release/23.9',
			releaseType: 'latest',
		} );
		expect( git.raw ).toHaveBeenCalledWith(
			'ls-remote',
			'--refs',
			'origin',
			'refs/npm-release/wp-latest/release-type/*',
			'refs/npm-release/wp-latest/plugin-release-branch/*'
		);
	} );

	it( 'cleans annotated package tags from a real scratch remote', async () => {
		const fixture = await createGitFixture();
		try {
			await fixture.git.raw(
				'tag',
				'-a',
				'@wordpress/a11y@4.54.0',
				'-m',
				'Package release'
			);
			const publishCommit = await fixture.git.revparse( 'HEAD' );
			await pushNpmReleasePreparedCommit(
				{
					gitWorkingDirectoryPath: fixture.repositoryPath,
					npmReleaseBranch: 'wp/latest',
					packageTags: [ '@wordpress/a11y@4.54.0' ],
					pluginReleaseBranch: 'release/23.9',
					publishCommit,
					releaseType: 'latest',
				},
				{ git: fixture.git }
			);

			await expect(
				deleteNpmReleasePreparedCommit(
					fixture.repositoryPath,
					'wp/latest',
					{ git: fixture.git }
				)
			).resolves.toBeUndefined();
			await expect(
				fixture.remote.raw(
					'for-each-ref',
					'--format=%(refname)',
					'refs/npm-release'
				)
			).resolves.toBe( '' );
			expect( console ).toHaveLogged();
		} finally {
			await fixture.cleanup();
		}
	} );

	it( 'does not follow public tags while pushing scratch refs', async () => {
		const fixture = await createGitFixture();
		try {
			await fixture.git.addConfig( 'push.followTags', 'true' );
			await fixture.git.raw(
				'tag',
				'-a',
				'unrelated@1.0.0',
				'-m',
				'Unrelated tag'
			);
			const publishCommit = await fixture.git.revparse( 'HEAD' );
			await pushNpmReleasePreparedCommit(
				{
					gitWorkingDirectoryPath: fixture.repositoryPath,
					npmReleaseBranch: 'wp/latest',
					packageTags: [],
					pluginReleaseBranch: 'release/23.9',
					publishCommit,
					releaseType: 'latest',
				},
				{ git: fixture.git }
			);

			await expect(
				fixture.remote.raw(
					'for-each-ref',
					'--format=%(refname)',
					'refs/tags'
				)
			).resolves.toBe( '' );
			expect( console ).toHaveLogged();
		} finally {
			await fixture.cleanup();
		}
	} );

	it( 'does not repeat a backport that already reached its destination', async () => {
		const fixture = await createGitFixture();
		try {
			await fixture.git.raw( 'branch', '-M', 'trunk' );
			await fixture.git.push( [ '--set-upstream', 'origin', 'trunk' ] );
			await fixture.git.checkoutLocalBranch( 'release-source' );
			await fixture.git.checkout( 'trunk' );
			await writeFile(
				join( fixture.repositoryPath, 'trunk.txt' ),
				'trunk\n'
			);
			await fixture.git.add( 'trunk.txt' );
			await fixture.git.commit( 'Trunk change' );
			await fixture.git.push( 'origin', 'trunk' );
			await fixture.git.checkout( 'release-source' );
			await writeFile(
				join( fixture.repositoryPath, 'package.json' ),
				'{"version":"1.0.0"}\n'
			);
			await fixture.git.add( 'package.json' );
			const releaseCommit = await fixture.git.commit( 'Release change' );
			const config = {
				gitWorkingDirectoryPath: fixture.repositoryPath,
				interactive: false,
			};
			await expect(
				fixture.git.raw(
					'cherry',
					'origin/trunk',
					releaseCommit.commit
				)
			).resolves.toContain( `+ ${ releaseCommit.commit }` );

			await backportCommitsToBranch(
				'trunk',
				[ releaseCommit.commit ],
				config
			);
			await expect(
				backportCommitsToBranch(
					'trunk',
					[ releaseCommit.commit ],
					config
				)
			).resolves.toBeUndefined();

			const subjects = await fixture.remote.raw(
				'log',
				'--format=%s',
				'refs/heads/trunk'
			);
			expect(
				subjects
					.split( '\n' )
					.filter( ( line ) => line === 'Release change' )
			).toHaveLength( 1 );
			expect( console ).toHaveLogged();
		} finally {
			await fixture.cleanup();
		}
	} );

	it( 'rejects a prepared release created by a different route', async () => {
		const git = { fetch: vi.fn(), checkout: vi.fn() };

		await expect(
			resumePreparedNpmRelease(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					interactive: false,
					npmReleaseBranch: 'wp/latest',
					releaseType: 'latest',
				},
				{
					getPreparedCommitFn: vi
						.fn()
						.mockResolvedValue( 'prepared-sha' ),
					getPreparedStateFn: vi.fn().mockResolvedValue( {
						releaseType: 'bugfix',
					} ),
					git,
				}
			)
		).rejects.toThrow(
			'Prepared release route is "bugfix", but this run requested "latest".'
		);
		expect( git.checkout ).not.toHaveBeenCalled();
	} );

	it( 'rejects a prepared release with a different plugin branch', async () => {
		const git = { fetch: vi.fn(), checkout: vi.fn() };

		await expect(
			resumePreparedNpmRelease(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					interactive: false,
					npmReleaseBranch: 'wp/latest',
					releaseType: 'latest',
				},
				{
					getPreparedCommitFn: vi
						.fn()
						.mockResolvedValue( 'prepared-sha' ),
					getPreparedPluginReleaseBranchFn: vi
						.fn()
						.mockReturnValue( 'release/23.9' ),
					getPreparedStateFn: vi.fn().mockResolvedValue( {
						pluginReleaseBranch: 'release/23.8',
						releaseType: 'latest',
					} ),
					git,
				}
			)
		).rejects.toThrow(
			'Prepared plugin release branch is "release/23.8", but the prepared commit requires "release/23.9".'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'persists the package tags alongside the prepared commit', async () => {
		const pushPreparedCommitFn = vi.fn();

		await publishVersionedPackagesToNpm(
			{
				distTag: 'latest',
				gitWorkingDirectoryPath: '/repo',
				noVerifyAccessFlag: '--no-verify-access',
				npmReleaseBranch: 'wp/latest',
				pluginReleaseBranch: 'release/23.9',
				releaseType: 'latest',
				yesFlag: '--yes',
			},
			{
				commandFn: vi.fn().mockResolvedValue(),
				getNpmReleasePackagesFn: vi.fn().mockResolvedValue( [
					{
						name: '@wordpress/a11y',
						version: '4.54.0',
						tagName: '@wordpress/a11y@4.54.0',
					},
				] ),
				git: {
					raw: vi.fn().mockResolvedValue( '' ),
					revparse: vi.fn().mockResolvedValue( 'publish-sha' ),
				},
				pushNpmReleaseGitMetadataFn: vi.fn(),
				pushPreparedCommitFn,
				runNpmPublishPreflightFn: vi
					.fn()
					.mockResolvedValueOnce( [] )
					.mockResolvedValueOnce( [ '@wordpress/a11y' ] ),
				wait: vi.fn(),
			}
		);

		expect( pushPreparedCommitFn.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				npmReleaseBranch: 'wp/latest',
				packageTags: [ '@wordpress/a11y@4.54.0' ],
				pluginReleaseBranch: 'release/23.9',
				publishCommit: 'publish-sha',
				releaseType: 'latest',
			} )
		);
		expect( console ).toHaveLogged();
	} );

	it( 'publishes the prepared commit marker only after every tag batch succeeds', async () => {
		const packageTags = Array.from(
			{ length: 26 },
			( _, index ) => `tag-${ index }`
		);
		const git = {
			raw: vi.fn( ( ...args ) => {
				if ( args.some( ( arg ) => arg.includes( 'tag-25' ) ) ) {
					throw new Error( 'tag push failed' );
				}
			} ),
		};

		await expect(
			pushNpmReleasePreparedCommit(
				{
					gitWorkingDirectoryPath: '/repo',
					npmReleaseBranch: 'wp/latest',
					packageTags,
					pluginReleaseBranch: 'release/23.9',
					publishCommit: 'publish-sha',
					releaseType: 'latest',
				},
				{ git }
			)
		).rejects.toThrow( 'tag push failed' );
		expect( console ).toHaveLogged();

		expect( git.raw ).not.toHaveBeenCalledWith(
			'push',
			'--no-follow-tags',
			'--force',
			'origin',
			'publish-sha:refs/npm-release/wp-latest/commit'
		);
	} );

	it( 'persists the release route before the prepared commit marker', async () => {
		const git = { raw: vi.fn().mockResolvedValue( '' ) };

		await pushNpmReleasePreparedCommit(
			{
				gitWorkingDirectoryPath: '/repo',
				npmReleaseBranch: 'wp/latest',
				packageTags: [],
				pluginReleaseBranch: 'release/23.9',
				publishCommit: 'publish-sha',
				releaseType: 'latest',
			},
			{ git }
		);

		expect( git.raw ).toHaveBeenNthCalledWith(
			1,
			'push',
			'--no-follow-tags',
			'--force',
			'origin',
			'publish-sha:refs/npm-release/wp-latest/release-type/latest',
			'publish-sha:refs/npm-release/wp-latest/plugin-release-branch/release/23.9'
		);
		expect( git.raw ).toHaveBeenNthCalledWith(
			2,
			'push',
			'--no-follow-tags',
			'--force',
			'origin',
			'publish-sha:refs/npm-release/wp-latest/commit'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'restores the prepared package tags before resuming a release', async () => {
		const restorePreparedTagsFn = vi.fn();
		const publishVersionedPackagesToNpmFn = vi.fn();

		await resumePreparedNpmRelease(
			{
				distTag: 'latest',
				gitWorkingDirectoryPath: '/repo',
				interactive: false,
				minimumVersionBump: 'minor',
				npmReleaseBranch: 'wp/latest',
				releaseType: 'latest',
			},
			{
				commandFn: vi.fn().mockResolvedValue(),
				getPreparedCommitFn: vi
					.fn()
					.mockResolvedValue( 'prepared-sha' ),
				getPreparedChangelogCommitFn: vi.fn().mockResolvedValue( null ),
				getPreparedPluginReleaseBranchFn: vi
					.fn()
					.mockReturnValue( 'release/23.9' ),
				getPreparedStateFn: vi.fn().mockResolvedValue( {
					pluginReleaseBranch: 'release/23.9',
					releaseType: 'latest',
				} ),
				git: {
					checkout: vi.fn(),
					fetch: vi.fn(),
					raw: vi.fn().mockResolvedValue( '' ),
					revparse: vi.fn().mockResolvedValue( 'prepared-sha' ),
				},
				isGitMetadataPublishedFn: vi.fn().mockResolvedValue( false ),
				publishVersionedPackagesToNpmFn,
				restorePreparedTagsFn,
			}
		);

		// Without the tags, getNpmReleasePackages returns nothing on a fresh
		// runner and the release silently completes having pushed none of them.
		expect( restorePreparedTagsFn ).toHaveBeenCalled();
		expect(
			restorePreparedTagsFn.mock.invocationCallOrder[ 0 ]
		).toBeLessThan(
			publishVersionedPackagesToNpmFn.mock.invocationCallOrder[ 0 ]
		);
		expect( console ).toHaveLogged();
	} );

	it( 'does not report published Git metadata while package tags are missing', async () => {
		await expect(
			isNpmReleaseGitMetadataPublished(
				{
					gitWorkingDirectoryPath: '/repo',
					npmReleaseBranch: 'wp/latest',
					preparedCommit: 'prepared-sha',
				},
				{
					getPreparedTagNamesFn: vi
						.fn()
						.mockResolvedValue( [ '@wordpress/a11y@4.54.0' ] ),
					getRemoteBranchShaFn: vi
						.fn()
						.mockResolvedValue( 'branch-sha' ),
					git: { raw: vi.fn().mockResolvedValue( 'prepared-sha' ) },
					verifyRemotePackageTagsFn: vi
						.fn()
						.mockRejectedValue( new Error( 'tag missing' ) ),
				}
			)
		).resolves.toBe( false );
	} );

	it( 'does not report published Git metadata when the branch lacks the commit', async () => {
		const verifyRemotePackageTagsFn = vi.fn().mockResolvedValue();

		await expect(
			isNpmReleaseGitMetadataPublished(
				{
					gitWorkingDirectoryPath: '/repo',
					npmReleaseBranch: 'wp/latest',
					preparedCommit: 'prepared-sha',
				},
				{
					getRemoteBranchShaFn: vi
						.fn()
						.mockResolvedValue( 'branch-sha' ),
					git: {
						raw: vi.fn().mockResolvedValue( 'common-base-sha' ),
					},
					verifyRemotePackageTagsFn,
				}
			)
		).resolves.toBe( false );
		expect( verifyRemotePackageTagsFn ).not.toHaveBeenCalled();
	} );

	it( 'reports published Git metadata once the branch and every tag landed', async () => {
		await expect(
			isNpmReleaseGitMetadataPublished(
				{
					gitWorkingDirectoryPath: '/repo',
					npmReleaseBranch: 'wp/latest',
					preparedCommit: 'prepared-sha',
				},
				{
					getPreparedTagNamesFn: vi
						.fn()
						.mockResolvedValue( [ '@wordpress/a11y@4.54.0' ] ),
					getRemoteBranchShaFn: vi
						.fn()
						.mockResolvedValue( 'branch-sha' ),
					git: { raw: vi.fn().mockResolvedValue( 'prepared-sha' ) },
					verifyRemotePackageTagsFn: vi.fn().mockResolvedValue(),
				}
			)
		).resolves.toBe( true );
	} );
} );
