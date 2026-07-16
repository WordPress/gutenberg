/**
 * Internal dependencies
 */
import {
	backportCommitsToBranch,
	checkoutNpmReleaseBranch,
	createNpmReleaseFinalizationMarker,
	createNpmReleaseMarker,
	finalizePreparedNpmRelease,
	getConfig,
	getNpmReleasePackages,
	getNpmReleaseGitRecoveryCommands,
	getPendingPreparedNpmReleaseState,
	getPreparedNpmReleasePackages,
	getPreparedNpmReleaseState,
	getRemoteBranchSha,
	getRemoteTagShas,
	getTagPushCommands,
	getTagRefspec,
	isNpmReleaseFinalizationMarker,
	prepareNpmRelease,
	preparePackagesForNpm,
	publishPreparedPackagesToNpm,
	publishVersionedPackagesToNpm,
	pushNpmReleaseGitMetadata,
	runPackagesRelease,
	runNpmPublishPreflight,
	runNpmReleasePhase,
	verifyRemotePackageTags,
} from '../packages';

describe( 'backportCommitsToBranch', () => {
	it( 'skips commits whose patches are already present', async () => {
		const repo = {
			checkout: jest.fn().mockReturnThis(),
			fetch: jest.fn().mockReturnThis(),
			pull: jest.fn().mockResolvedValue(),
			push: jest.fn().mockResolvedValue(),
			raw: jest
				.fn()
				.mockResolvedValueOnce( '- existing-sha' )
				.mockResolvedValueOnce( '+ new-sha' )
				.mockResolvedValueOnce(),
		};

		await backportCommitsToBranch(
			'trunk',
			[ 'existing-sha', 'new-sha' ],
			{
				abortMessage: 'Aborting!',
				gitWorkingDirectoryPath: '/repo',
				interactive: false,
			},
			{ repo }
		);

		expect( repo.raw ).toHaveBeenNthCalledWith(
			1,
			'cherry',
			'HEAD',
			'existing-sha',
			'existing-sha^'
		);
		expect( repo.raw ).toHaveBeenNthCalledWith(
			2,
			'cherry',
			'HEAD',
			'new-sha',
			'new-sha^'
		);
		expect( repo.raw ).toHaveBeenNthCalledWith(
			3,
			'cherry-pick',
			'new-sha'
		);
		expect( repo.push ).toHaveBeenCalledWith( 'origin', 'trunk' );
		expect( console ).toHaveLogged();
	} );
} );

describe( 'checkoutNpmReleaseBranch', () => {
	it( 'resets an existing local branch to the fetched remote head', async () => {
		const git = {
			fetch: jest.fn().mockResolvedValue(),
			raw: jest.fn().mockResolvedValue(),
		};

		await checkoutNpmReleaseBranch(
			{
				gitWorkingDirectoryPath: '/repo',
				npmReleaseBranch: 'wp/latest',
			},
			{ git }
		);

		expect( git.fetch ).toHaveBeenCalledWith( 'origin', 'wp/latest', [
			'--depth=999',
		] );
		expect( git.raw ).toHaveBeenCalledWith(
			'checkout',
			'-B',
			'wp/latest',
			'FETCH_HEAD'
		);
		expect( git.fetch.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			git.raw.mock.invocationCallOrder[ 0 ]
		);
		expect( console ).toHaveLogged();
	} );
} );

describe( 'createNpmReleaseMarker', () => {
	it( 'records the release type and synced source branch', async () => {
		const git = { raw: jest.fn().mockResolvedValue() };

		await createNpmReleaseMarker(
			'release/23.5',
			{
				gitWorkingDirectoryPath: '/repo',
				releaseId: 'run-123',
				releaseType: 'latest',
			},
			{ git }
		);

		expect( git.raw ).toHaveBeenCalledWith(
			'commit',
			'--allow-empty',
			'-m',
			'chore(release): prepare npm latest from release/23.5 [release-id: run-123]'
		);
	} );
} );

describe( 'isNpmReleaseFinalizationMarker', () => {
	it( 'accepts an exact child marker with the prepared release tree', async () => {
		const git = {
			raw: jest
				.fn()
				.mockResolvedValue(
					'publish-sha\u0000tree-sha\u0000chore(release): finalize npm latest [release-id: run-123]\n'
				),
			revparse: jest.fn().mockResolvedValue( 'tree-sha\n' ),
		};

		await expect(
			isNpmReleaseFinalizationMarker(
				'finalization-sha',
				{
					gitWorkingDirectoryPath: '/repo',
					publishCommit: 'publish-sha',
					releaseId: 'run-123',
					releaseType: 'latest',
				},
				{ git }
			)
		).resolves.toBe( true );
	} );

	it.each( [
		[
			'another parent',
			'other-sha\u0000tree-sha\u0000chore(release): finalize npm latest [release-id: run-123]\n',
		],
		[
			'another tree',
			'publish-sha\u0000other-tree\u0000chore(release): finalize npm latest [release-id: run-123]\n',
		],
	] )( 'rejects a marker with %s', async ( _label, description ) => {
		await expect(
			isNpmReleaseFinalizationMarker(
				'finalization-sha',
				{
					gitWorkingDirectoryPath: '/repo',
					publishCommit: 'publish-sha',
					releaseId: 'run-123',
					releaseType: 'latest',
				},
				{
					git: {
						raw: jest.fn().mockResolvedValue( description ),
						revparse: jest.fn().mockResolvedValue( 'tree-sha\n' ),
					},
				}
			)
		).resolves.toBe( false );
	} );
} );

describe( 'createNpmReleaseFinalizationMarker', () => {
	it( 'advances the release branch after finalization completes', async () => {
		const git = {
			raw: jest
				.fn()
				.mockResolvedValueOnce( 'finalization-sha\n' )
				.mockResolvedValueOnce(),
		};
		const runPhase = jest.fn( ( description, callback ) => callback() );
		const releaseState = {
			npmReleaseBranch: 'wp/latest',
			publishCommit: 'publish-sha',
			releaseId: 'run-123',
			releaseType: 'latest',
		};

		await createNpmReleaseFinalizationMarker(
			releaseState,
			{ gitWorkingDirectoryPath: '/repo' },
			{
				getRemoteBranchShaFn: jest
					.fn()
					.mockResolvedValue( 'publish-sha' ),
				git,
				runPhase,
			}
		);

		expect( git.raw ).toHaveBeenNthCalledWith(
			1,
			'commit-tree',
			'publish-sha^{tree}',
			'-p',
			'publish-sha',
			'-m',
			'chore(release): finalize npm latest [release-id: run-123]'
		);
		expect( runPhase ).toHaveBeenCalledWith(
			'Finalization marker push',
			expect.any( Function )
		);
		expect( git.raw ).toHaveBeenNthCalledWith(
			2,
			'push',
			'origin',
			'finalization-sha:refs/heads/wp/latest'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'recovers when a successful marker push loses its acknowledgement', async () => {
		const git = {
			raw: jest
				.fn()
				.mockResolvedValueOnce( 'finalization-sha\n' )
				.mockRejectedValueOnce( new Error( 'Connection closed' ) ),
		};
		const getRemoteBranchShaFn = jest
			.fn()
			.mockResolvedValueOnce( 'publish-sha' )
			.mockResolvedValueOnce( 'finalization-sha' );
		const runPhase = jest.fn( async ( _description, callback ) => {
			await expect( callback() ).rejects.toThrow( 'Connection closed' );
			await callback();
		} );

		await createNpmReleaseFinalizationMarker(
			{
				npmReleaseBranch: 'wp/latest',
				publishCommit: 'publish-sha',
				releaseId: 'run-123',
				releaseType: 'latest',
			},
			{ gitWorkingDirectoryPath: '/repo' },
			{ getRemoteBranchShaFn, git, runPhase }
		);

		expect( getRemoteBranchShaFn ).toHaveBeenCalledTimes( 2 );
		expect( git.raw ).toHaveBeenCalledTimes( 2 );
		expect( console ).toHaveLogged();
	} );

	it( 'accepts an equivalent marker without truncating release history', async () => {
		const git = {
			fetch: jest.fn().mockResolvedValue(),
			raw: jest.fn().mockResolvedValue( 'local-finalization-sha\n' ),
		};
		const isFinalizationMarkerFn = jest.fn().mockResolvedValue( true );

		await createNpmReleaseFinalizationMarker(
			{
				npmReleaseBranch: 'wp/latest',
				publishCommit: 'publish-sha',
				releaseId: 'run-123',
				releaseType: 'latest',
			},
			{ gitWorkingDirectoryPath: '/repo' },
			{
				getRemoteBranchShaFn: jest
					.fn()
					.mockResolvedValue( 'remote-finalization-sha' ),
				git,
				isFinalizationMarkerFn,
				runPhase: jest.fn( ( _description, callback ) => callback() ),
			}
		);

		expect( git.fetch ).toHaveBeenCalledWith( 'origin', 'wp/latest', [
			'--depth=999',
		] );
		expect( isFinalizationMarkerFn ).toHaveBeenCalledWith(
			'remote-finalization-sha',
			expect.objectContaining( {
				publishCommit: 'publish-sha',
				releaseId: 'run-123',
				releaseType: 'latest',
			} ),
			{ git }
		);
		expect( git.raw ).toHaveBeenCalledTimes( 1 );
		expect( console ).toHaveLogged();
	} );
} );

describe( 'runPackagesRelease', () => {
	const getTestConfig = () => ( {
		abortMessage: 'Aborting!',
		gitWorkingDirectoryPath: '/repo',
		interactive: false,
	} );

	it( 'runs the durable release lifecycle in order', async () => {
		const config = getTestConfig();
		const finalizePreparedNpmReleaseFn = jest.fn();
		const prepareNpmReleaseFn = jest.fn().mockResolvedValue( true );
		const publishPreparedPackagesToNpmFn = jest.fn();

		await runPackagesRelease( config, [], {
			finalizePreparedNpmReleaseFn,
			prepareNpmReleaseFn,
			publishPreparedPackagesToNpmFn,
		} );

		expect( prepareNpmReleaseFn ).toHaveBeenCalledTimes( 1 );
		expect( prepareNpmReleaseFn ).toHaveBeenCalledWith( config );
		expect( publishPreparedPackagesToNpmFn ).toHaveBeenCalledTimes( 1 );
		expect( publishPreparedPackagesToNpmFn ).toHaveBeenCalledWith( config );
		expect( finalizePreparedNpmReleaseFn ).toHaveBeenCalledTimes( 1 );
		expect( finalizePreparedNpmReleaseFn ).toHaveBeenCalledWith( config );
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
		expect( console ).toHaveLogged();
	} );

	it( 'stops after prepare when no packages were versioned', async () => {
		const finalizePreparedNpmReleaseFn = jest.fn();
		const publishPreparedPackagesToNpmFn = jest.fn();

		await runPackagesRelease( getTestConfig(), [], {
			finalizePreparedNpmReleaseFn,
			prepareNpmReleaseFn: jest.fn(),
			publishPreparedPackagesToNpmFn,
		} );

		expect( publishPreparedPackagesToNpmFn ).not.toHaveBeenCalled();
		expect( finalizePreparedNpmReleaseFn ).not.toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );

	it( 'stops when the same release invocation is already finalized', async () => {
		const finalizePreparedNpmReleaseFn = jest.fn();
		const publishPreparedPackagesToNpmFn = jest.fn();

		await runPackagesRelease( getTestConfig(), [], {
			finalizePreparedNpmReleaseFn,
			prepareNpmReleaseFn: jest.fn().mockResolvedValue( {
				isFinalized: true,
				releaseId: 'run-123',
			} ),
			publishPreparedPackagesToNpmFn,
		} );

		expect( publishPreparedPackagesToNpmFn ).not.toHaveBeenCalled();
		expect( finalizePreparedNpmReleaseFn ).not.toHaveBeenCalled();
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
			raw: jest
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
				globFn: jest.fn().mockResolvedValue( files ),
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

describe( 'getPreparedNpmReleasePackages', () => {
	it( 'derives public version changes from the exact prepared commit', async () => {
		const manifestByRef = {
			'publish-sha:packages/a11y/package.json':
				'{"name":"@wordpress/a11y","version":"4.50.0"}',
			'publish-sha^:packages/a11y/package.json':
				'{"name":"@wordpress/a11y","version":"4.49.0"}',
			'publish-sha:packages/blocks/package.json':
				'{"name":"@wordpress/blocks","version":"14.20.0"}',
			'publish-sha^:packages/blocks/package.json':
				'{"name":"@wordpress/blocks","version":"14.20.0"}',
			'publish-sha:packages/private/package.json':
				'{"name":"@wordpress/private","private":true,"version":"2.0.0"}',
			'publish-sha^:packages/private/package.json':
				'{"name":"@wordpress/private","private":true,"version":"1.0.0"}',
		};
		const git = {
			raw: jest
				.fn()
				.mockResolvedValueOnce(
					'packages/a11y/package.json\npackages/blocks/package.json\npackages/private/package.json\n'
				)
				.mockImplementation( ( commandName, manifestRef ) =>
					Promise.resolve( manifestByRef[ manifestRef ] )
				),
		};

		await expect(
			getPreparedNpmReleasePackages( '/repo', 'publish-sha', {
				git,
			} )
		).resolves.toEqual( [
			{
				name: '@wordpress/a11y',
				tagName: '@wordpress/a11y@4.50.0',
				version: '4.50.0',
			},
		] );
		expect( git.raw ).toHaveBeenCalledWith(
			'show',
			'publish-sha:packages/a11y/package.json'
		);
	} );
} );

describe( 'getPreparedNpmReleaseState', () => {
	const releasePackages = [
		{
			name: '@wordpress/a11y',
			tagName: '@wordpress/a11y@4.50.0',
			version: '4.50.0',
		},
	];

	it( 'reconstructs release state from commit ancestry', async () => {
		const getRemoteBranchShaFn = jest
			.fn()
			.mockResolvedValue( 'publish-sha' );
		const git = {
			raw: jest
				.fn()
				.mockResolvedValueOnce( 'chore(release): publish\n' )
				.mockResolvedValueOnce(
					'changelog-sha\u0000Update changelog files\n'
				)
				.mockResolvedValueOnce(
					'chore(release): prepare npm latest from release/23.5 [release-id: run-123]\n'
				),
			revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
		};

		await expect(
			getPreparedNpmReleaseState(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					npmReleaseBranch: 'wp/latest',
					releaseType: 'latest',
				},
				{
					getPreparedNpmReleasePackagesFn: jest
						.fn()
						.mockResolvedValue( releasePackages ),
					git,
					getRemoteBranchShaFn,
				}
			)
		).resolves.toEqual( {
			changelogCommit: 'changelog-sha',
			distTag: 'latest',
			isFinalized: false,
			npmReleaseBranch: 'wp/latest',
			pluginReleaseBranch: 'release/23.5',
			publishCommit: 'publish-sha',
			releasePackages,
			releaseId: 'run-123',
			releaseType: 'latest',
		} );
		expect( getRemoteBranchShaFn ).toHaveBeenCalledWith(
			'/repo',
			'wp/latest'
		);
	} );

	it( 'recognizes a release finalized by an earlier split-phase run', async () => {
		const git = {
			fetch: jest.fn().mockResolvedValue(),
			raw: jest
				.fn()
				.mockResolvedValueOnce( 'chore(release): publish\n' )
				.mockResolvedValueOnce(
					'changelog-sha\u0000Update changelog files\n'
				)
				.mockResolvedValueOnce(
					'chore(release): prepare npm latest from release/23.5 [release-id: run-123]\n'
				),
			revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
		};
		const isFinalizationMarkerFn = jest.fn().mockResolvedValue( true );

		await expect(
			getPreparedNpmReleaseState(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					npmReleaseBranch: 'wp/latest',
					releaseType: 'latest',
				},
				{
					getPreparedNpmReleasePackagesFn: jest
						.fn()
						.mockResolvedValue( releasePackages ),
					getRemoteBranchShaFn: jest
						.fn()
						.mockResolvedValue( 'finalization-sha' ),
					git,
					isFinalizationMarkerFn,
					publishCommit: 'publish-sha',
				}
			)
		).resolves.toEqual(
			expect.objectContaining( {
				isFinalized: true,
				publishCommit: 'publish-sha',
				releaseId: 'run-123',
			} )
		);
		expect( git.fetch ).toHaveBeenCalledWith( 'origin', 'wp/latest', [
			'--depth=999',
		] );
		expect( git.revparse ).not.toHaveBeenCalled();
		expect( isFinalizationMarkerFn ).toHaveBeenCalledWith(
			'finalization-sha',
			expect.objectContaining( {
				publishCommit: 'publish-sha',
				releaseId: 'run-123',
				releaseType: 'latest',
			} ),
			{ git }
		);
	} );

	it( 'rejects a prepared commit from another release route', async () => {
		const git = {
			raw: jest
				.fn()
				.mockResolvedValueOnce( 'chore(release): publish\n' )
				.mockResolvedValueOnce(
					'marker-sha\u0000chore(release): prepare npm bugfix [release-id: run-123]\n'
				)
				.mockResolvedValueOnce(
					'chore(release): prepare npm bugfix [release-id: run-123]\n'
				),
			revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
		};

		await expect(
			getPreparedNpmReleaseState(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					npmReleaseBranch: 'wp/latest',
					releaseType: 'latest',
				},
				{
					getPreparedNpmReleasePackagesFn: jest
						.fn()
						.mockResolvedValue( releasePackages ),
					git,
				}
			)
		).rejects.toThrow(
			'Prepared npm release commit publish-sha does not match the latest release route.'
		);
	} );
} );

describe( 'getPendingPreparedNpmReleaseState', () => {
	const releasePackages = [
		{
			name: '@wordpress/a11y',
			tagName: '@wordpress/a11y@4.50.0',
			version: '4.50.0',
		},
	];
	const config = {
		gitWorkingDirectoryPath: '/repo',
		npmReleaseBranch: 'wp/latest',
		releaseId: 'run-123',
		releaseType: 'latest',
	};

	it( 'reuses a prepared commit whose package tags are still missing', async () => {
		const releaseState = { publishCommit: 'publish-sha' };
		const getPreparedNpmReleaseStateFn = jest
			.fn()
			.mockResolvedValue( releaseState );

		await expect(
			getPendingPreparedNpmReleaseState( config, {
				getPreparedNpmReleasePackagesFn: jest
					.fn()
					.mockResolvedValue( releasePackages ),
				getPreparedNpmReleaseStateFn,
				getRemoteTagShasFn: jest.fn().mockResolvedValue( new Map() ),
				git: {
					raw: jest
						.fn()
						.mockResolvedValue( 'chore(release): publish\n' ),
					revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
				},
			} )
		).resolves.toBe( releaseState );
		expect( getPreparedNpmReleaseStateFn ).toHaveBeenCalledWith( config );
		expect( console ).toHaveLogged();
	} );

	it( 'reuses a prepared commit until finalization is recorded', async () => {
		const releaseState = { publishCommit: 'publish-sha' };
		const getPreparedNpmReleaseStateFn = jest
			.fn()
			.mockResolvedValue( releaseState );

		await expect(
			getPendingPreparedNpmReleaseState( config, {
				getPreparedNpmReleasePackagesFn: jest
					.fn()
					.mockResolvedValue( releasePackages ),
				getPreparedNpmReleaseStateFn,
				getRemoteTagShasFn: jest
					.fn()
					.mockResolvedValue(
						new Map( [
							[ '@wordpress/a11y@4.50.0', 'publish-sha' ],
						] )
					),
				git: {
					raw: jest
						.fn()
						.mockResolvedValue( 'chore(release): publish\n' ),
					revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
				},
			} )
		).resolves.toBe( releaseState );
		expect( getPreparedNpmReleaseStateFn ).toHaveBeenCalledWith( config );
		expect( console ).toHaveLogged();
	} );

	it( 'returns the finalized release identity recorded at HEAD', async () => {
		const getPreparedNpmReleasePackagesFn = jest.fn();
		const releaseState = {
			isFinalized: true,
			publishCommit: 'publish-sha',
			releaseId: 'run-123',
			releaseType: 'latest',
		};
		const getPreparedNpmReleaseStateFn = jest
			.fn()
			.mockResolvedValue( releaseState );
		const git = {
			raw: jest
				.fn()
				.mockResolvedValue(
					'chore(release): finalize npm latest [release-id: run-123]\n'
				),
			revparse: jest
				.fn()
				.mockResolvedValueOnce( 'finalization-sha' )
				.mockResolvedValueOnce( 'publish-sha' ),
		};
		await expect(
			getPendingPreparedNpmReleaseState( config, {
				getPreparedNpmReleasePackagesFn,
				getPreparedNpmReleaseStateFn,
				git,
			} )
		).resolves.toBe( releaseState );
		expect( getPreparedNpmReleasePackagesFn ).not.toHaveBeenCalled();
		expect( getPreparedNpmReleaseStateFn ).toHaveBeenCalledWith(
			expect.objectContaining( { releaseType: 'latest' } ),
			expect.objectContaining( { git, publishCommit: 'publish-sha' } )
		);
	} );

	it( 'rejects a marker whose parent is not a valid prepared release', async () => {
		const git = {
			raw: jest
				.fn()
				.mockResolvedValue(
					'chore(release): finalize npm latest [release-id: run-123]\n'
				),
			revparse: jest
				.fn()
				.mockResolvedValueOnce( 'finalization-sha' )
				.mockResolvedValueOnce( 'publish-sha' ),
		};

		await expect(
			getPendingPreparedNpmReleaseState( config, {
				getPreparedNpmReleaseStateFn: jest.fn().mockResolvedValue( {
					isFinalized: false,
					publishCommit: 'publish-sha',
					releaseId: 'run-123',
					releaseType: 'latest',
				} ),
				git,
			} )
		).rejects.toThrow(
			'Invalid npm release finalization marker finalization-sha.'
		);
	} );

	it( 'rejects package tags that point to another commit', async () => {
		await expect(
			getPendingPreparedNpmReleaseState( config, {
				getPreparedNpmReleasePackagesFn: jest
					.fn()
					.mockResolvedValue( releasePackages ),
				getRemoteTagShasFn: jest
					.fn()
					.mockResolvedValue(
						new Map( [ [ '@wordpress/a11y@4.50.0', 'other-sha' ] ] )
					),
				git: {
					raw: jest
						.fn()
						.mockResolvedValue( 'chore(release): publish\n' ),
					revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
				},
			} )
		).rejects.toThrow(
			'Package tag @wordpress/a11y@4.50.0 points to other-sha, expected publish-sha.'
		);
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
			raw: jest
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
			raw: jest
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
					getRemoteTagShasFn: jest.fn().mockResolvedValue(
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
	it( 'can validate public registry state without checking npm access', async () => {
		const commandFn = jest.fn().mockRejectedValueOnce( {
			stderr: 'npm ERR! code E404',
		} );

		await expect(
			runNpmPublishPreflight(
				{
					checkAccess: false,
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
		expect( commandFn ).toHaveBeenCalledTimes( 1 );
		expect( commandFn ).toHaveBeenCalledWith(
			'npm view @wordpress/a11y@4.50.0 version gitHead dist-tags --json',
			{ cwd: '/repo', stdio: 'pipe' }
		);
		expect( console ).toHaveLogged();
	} );

	it( 'uses the npm access command supported by current npm versions', async () => {
		const commandFn = jest
			.fn()
			.mockResolvedValueOnce()
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

		expect( commandFn ).toHaveBeenNthCalledWith(
			1,
			'npm access list packages @wordpress --json',
			{ cwd: '/repo', stdio: 'pipe' }
		);
		expect( commandFn ).toHaveBeenNthCalledWith(
			2,
			'npm view @wordpress/a11y@4.50.0 version gitHead dist-tags --json',
			{ cwd: '/repo', stdio: 'pipe' }
		);
		expect( console ).toHaveLogged();
	} );

	it( 'accepts a published version from the prepared commit with the expected dist-tag', async () => {
		const commandFn = jest
			.fn()
			.mockResolvedValueOnce()
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
		const commandFn = jest
			.fn()
			.mockResolvedValueOnce()
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
		const commandFn = jest
			.fn()
			.mockResolvedValueOnce()
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
		const commandFn = jest
			.fn()
			.mockResolvedValueOnce()
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
		const commandFn = jest
			.fn()
			.mockResolvedValueOnce()
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
		const task = jest
			.fn()
			.mockRejectedValueOnce( new Error( 'transient failure' ) )
			.mockResolvedValueOnce();
		const wait = jest.fn();

		await runNpmReleasePhase( 'Package tag push', task, { wait } );

		expect( task ).toHaveBeenCalledTimes( 2 );
		expect( wait ).toHaveBeenCalledWith( 5000 );
		expect( console ).toHaveLogged();
	} );
} );

describe( 'pushNpmReleaseGitMetadata', () => {
	it( 'pushes the branch before pushing and verifying package tags', async () => {
		const git = { raw: jest.fn().mockResolvedValue() };
		const runPhase = jest.fn( async ( _label, task ) => task() );
		const verifyRemoteNpmReleaseBranchFn = jest.fn();
		const verifyRemotePackageTagsFn = jest.fn();

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
	const releasePackages = [
		{
			name: '@wordpress/a11y',
			tagName: '@wordpress/a11y@4.50.0',
			version: '4.50.0',
		},
	];

	it( 'preflights and publishes from the exact prepared commit', async () => {
		const commandFn = jest.fn().mockResolvedValue();
		const runNpmPublishPreflightFn = jest
			.fn()
			.mockResolvedValueOnce( [] )
			.mockResolvedValueOnce( [ '@wordpress/a11y' ] );

		await publishVersionedPackagesToNpm(
			{
				distTag: 'latest',
				gitWorkingDirectoryPath: '/repo',
				noVerifyAccessFlag: '--no-verify-access',
				publishCommit: 'publish-sha',
				releasePackages,
				yesFlag: '--yes',
			},
			{
				commandFn,
				git: {
					raw: jest.fn().mockResolvedValue( '' ),
					revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
				},
				runNpmPublishPreflightFn,
			}
		);

		expect( runNpmPublishPreflightFn ).toHaveBeenCalledWith( {
			distTag: 'latest',
			gitWorkingDirectoryPath: '/repo',
			publishCommit: 'publish-sha',
			releasePackages,
		} );
		expect( commandFn ).toHaveBeenCalledWith(
			'npx lerna publish from-package --dist-tag latest --git-head publish-sha --yes --no-verify-access',
			{ cwd: '/repo', stdio: 'inherit' }
		);
		expect( runNpmPublishPreflightFn ).toHaveBeenCalledTimes( 2 );
		expect( console ).toHaveLogged();
	} );

	it( 'rechecks registry state before retrying from-package', async () => {
		const commandFn = jest
			.fn()
			.mockRejectedValueOnce( new Error( 'partial publish' ) )
			.mockResolvedValueOnce();
		const runNpmPublishPreflightFn = jest
			.fn()
			.mockResolvedValueOnce( [] )
			.mockResolvedValueOnce( [ '@wordpress/a11y' ] )
			.mockResolvedValueOnce( [
				'@wordpress/a11y',
				'@wordpress/blocks',
			] );
		const git = {
			raw: jest.fn().mockResolvedValue( '' ),
			revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
		};
		const nextReleasePackages = [
			{
				name: '@wordpress/a11y',
				tagName: '@wordpress/a11y@4.50.0-next.0',
				version: '4.50.0-next.0',
			},
			{
				name: '@wordpress/blocks',
				tagName: '@wordpress/blocks@14.20.0-next.0',
				version: '14.20.0-next.0',
			},
		];

		await publishVersionedPackagesToNpm(
			{
				distTag: 'next',
				gitWorkingDirectoryPath: '/repo',
				noVerifyAccessFlag: '--no-verify-access',
				publishCommit: 'publish-sha',
				releasePackages: nextReleasePackages,
				yesFlag: '--yes',
			},
			{
				commandFn,
				git,
				runNpmPublishPreflightFn,
			}
		);

		expect( commandFn ).toHaveBeenCalledTimes( 2 );
		expect( runNpmPublishPreflightFn ).toHaveBeenCalledTimes( 3 );
		expect( git.raw ).toHaveBeenCalledWith(
			'reset',
			'--hard',
			'publish-sha'
		);
		const resetCall = git.raw.mock.calls.findIndex(
			( [ commandName ] ) => commandName === 'reset'
		);
		expect( git.raw.mock.invocationCallOrder[ resetCall ] ).toBeLessThan(
			runNpmPublishPreflightFn.mock.invocationCallOrder[ 1 ]
		);
		expect( console ).toHaveLogged();
	} );

	it( 'skips Lerna when all package versions are already published', async () => {
		const commandFn = jest.fn();
		await publishVersionedPackagesToNpm(
			{
				distTag: 'latest',
				gitWorkingDirectoryPath: '/repo',
				noVerifyAccessFlag: '--no-verify-access',
				publishCommit: 'publish-sha',
				releasePackages,
				yesFlag: '--yes',
			},
			{
				commandFn,
				git: {
					raw: jest.fn().mockResolvedValue( '' ),
					revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
				},
				runNpmPublishPreflightFn: jest
					.fn()
					.mockResolvedValue( [ '@wordpress/a11y' ] ),
			}
		);

		expect( commandFn ).not.toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );

	it( 'fails when final registry verification is incomplete', async () => {
		const commandFn = jest.fn().mockResolvedValue();
		const runNpmPublishPreflightFn = jest.fn().mockResolvedValue( [] );
		const runPhase = jest.fn( async ( _label, task ) => task() );

		await expect(
			publishVersionedPackagesToNpm(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					noVerifyAccessFlag: '--no-verify-access',
					publishCommit: 'publish-sha',
					releasePackages,
					yesFlag: '--yes',
				},
				{
					commandFn,
					git: {
						raw: jest.fn().mockResolvedValue( '' ),
						revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
					},
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
			expect.any( Function )
		);
		expect( console ).toHaveLogged();
	} );

	it( 'retries final registry verification after propagation lag', async () => {
		const commandFn = jest.fn().mockResolvedValue();
		const runNpmPublishPreflightFn = jest
			.fn()
			.mockResolvedValueOnce( [] )
			.mockResolvedValueOnce( [] )
			.mockResolvedValueOnce( [ '@wordpress/a11y' ] );
		const wait = jest.fn();
		const runPhase = ( label, task ) =>
			runNpmReleasePhase( label, task, { wait } );
		const git = {
			raw: jest.fn().mockResolvedValue( '' ),
			revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
		};

		await publishVersionedPackagesToNpm(
			{
				distTag: 'latest',
				gitWorkingDirectoryPath: '/repo',
				noVerifyAccessFlag: '--no-verify-access',
				publishCommit: 'publish-sha',
				releasePackages,
				yesFlag: '--yes',
			},
			{
				commandFn,
				git,
				runNpmPublishPreflightFn,
				runPhase,
			}
		);

		expect( runNpmPublishPreflightFn ).toHaveBeenCalledTimes( 3 );
		expect( wait ).toHaveBeenCalledWith( 5000 );
		expect( console ).toHaveLogged();
	} );

	it( 'rejects a dirty prepared checkout before registry access', async () => {
		const commandFn = jest.fn();
		const runNpmPublishPreflightFn = jest.fn();

		await expect(
			publishVersionedPackagesToNpm(
				{
					distTag: 'latest',
					gitWorkingDirectoryPath: '/repo',
					noVerifyAccessFlag: '--no-verify-access',
					publishCommit: 'publish-sha',
					releasePackages,
					yesFlag: '--yes',
				},
				{
					commandFn,
					git: {
						raw: jest
							.fn()
							.mockResolvedValue(
								' M packages/a11y/package.json'
							),
						revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
					},
					runNpmPublishPreflightFn,
				}
			)
		).rejects.toThrow(
			'Prepared npm release checkout publish-sha has uncommitted changes.'
		);
		expect( runNpmPublishPreflightFn ).not.toHaveBeenCalled();
		expect( commandFn ).not.toHaveBeenCalled();
	} );
} );

describe( 'prepareNpmRelease', () => {
	it( 'reuses a pending prepared commit without mutating the branch', async () => {
		const pendingReleaseState = {
			isFinalized: false,
			publishCommit: 'publish-sha',
			releaseId: 'run-123',
			releaseType: 'latest',
		};
		const checkoutNpmReleaseBranchFn = jest.fn();
		const createNpmReleaseMarkerFn = jest.fn();
		const findPluginReleaseBranchNameFn = jest.fn();
		const preparePackagesForNpmFn = jest.fn();
		const runNpmReleaseBranchSyncStepFn = jest.fn();
		const updatePackagesFn = jest.fn();

		await expect(
			prepareNpmRelease(
				{
					gitWorkingDirectoryPath: '/repo',
					releaseId: 'run-123',
					releaseType: 'latest',
				},
				{
					checkoutNpmReleaseBranchFn,
					createNpmReleaseMarkerFn,
					findPluginReleaseBranchNameFn,
					getPendingPreparedNpmReleaseStateFn: jest
						.fn()
						.mockResolvedValue( pendingReleaseState ),
					preparePackagesForNpmFn,
					runNpmReleaseBranchSyncStepFn,
					updatePackagesFn,
				}
			)
		).resolves.toBe( pendingReleaseState );

		expect( checkoutNpmReleaseBranchFn ).toHaveBeenCalled();
		expect( findPluginReleaseBranchNameFn ).not.toHaveBeenCalled();
		expect( runNpmReleaseBranchSyncStepFn ).not.toHaveBeenCalled();
		expect( createNpmReleaseMarkerFn ).not.toHaveBeenCalled();
		expect( updatePackagesFn ).not.toHaveBeenCalled();
		expect( preparePackagesForNpmFn ).not.toHaveBeenCalled();
	} );

	it( 'rejects a pending release from another invocation', async () => {
		const createNpmReleaseMarkerFn = jest.fn();
		const preparePackagesForNpmFn = jest.fn();

		await expect(
			prepareNpmRelease(
				{
					gitWorkingDirectoryPath: '/repo',
					releaseId: 'run-456',
					releaseType: 'latest',
				},
				{
					checkoutNpmReleaseBranchFn: jest.fn(),
					createNpmReleaseMarkerFn,
					getPendingPreparedNpmReleaseStateFn: jest
						.fn()
						.mockResolvedValue( {
							isFinalized: false,
							publishCommit: 'publish-sha',
							releaseId: 'run-123',
							releaseType: 'latest',
						} ),
					preparePackagesForNpmFn,
				}
			)
		).rejects.toThrow(
			'A latest release from invocation run-123 is still pending.'
		);

		expect( createNpmReleaseMarkerFn ).not.toHaveBeenCalled();
		expect( preparePackagesForNpmFn ).not.toHaveBeenCalled();
	} );

	it( 'returns a finalized state for the same release invocation', async () => {
		const finalizedReleaseState = {
			isFinalized: true,
			releaseId: 'run-123',
			releaseType: 'latest',
		};
		const createNpmReleaseMarkerFn = jest.fn();
		const preparePackagesForNpmFn = jest.fn();

		await expect(
			prepareNpmRelease(
				{
					gitWorkingDirectoryPath: '/repo',
					releaseId: 'run-123',
					releaseType: 'latest',
				},
				{
					checkoutNpmReleaseBranchFn: jest.fn(),
					createNpmReleaseMarkerFn,
					getPendingPreparedNpmReleaseStateFn: jest
						.fn()
						.mockResolvedValue( finalizedReleaseState ),
					preparePackagesForNpmFn,
				}
			)
		).resolves.toBe( finalizedReleaseState );

		expect( createNpmReleaseMarkerFn ).not.toHaveBeenCalled();
		expect( preparePackagesForNpmFn ).not.toHaveBeenCalled();
	} );

	it( 'prepares a new release after another invocation finalized', async () => {
		const askForConfirmationFn = jest.fn().mockResolvedValue();
		const createNpmReleaseMarkerFn = jest.fn();
		const preparePackagesForNpmFn = jest
			.fn()
			.mockResolvedValue( { publishCommit: 'new-publish-sha' } );
		const runNpmReleaseBranchSyncStepFn = jest.fn();
		const updatePackagesFn = jest.fn();

		await expect(
			prepareNpmRelease(
				{
					abortMessage: 'Aborting!',
					gitWorkingDirectoryPath: '/repo',
					interactive: true,
					releaseId: 'run-456',
					releaseType: 'latest',
				},
				{
					askForConfirmationFn,
					checkoutNpmReleaseBranchFn: jest.fn(),
					createNpmReleaseMarkerFn,
					findPluginReleaseBranchNameFn: jest
						.fn()
						.mockResolvedValue( 'release/23.5' ),
					getPendingPreparedNpmReleaseStateFn: jest
						.fn()
						.mockResolvedValue( {
							isFinalized: true,
							releaseId: 'run-123',
							releaseType: 'latest',
						} ),
					preparePackagesForNpmFn,
					runNpmReleaseBranchSyncStepFn,
					updatePackagesFn,
				}
			)
		).resolves.toEqual( { publishCommit: 'new-publish-sha' } );

		expect( askForConfirmationFn ).toHaveBeenCalledWith(
			'The previous npm release (run-123) is finalized. Start a new latest release?',
			false,
			'Aborting!'
		);
		expect( runNpmReleaseBranchSyncStepFn ).toHaveBeenCalledWith(
			'release/23.5',
			expect.objectContaining( { releaseId: 'run-456' } )
		);
		expect( createNpmReleaseMarkerFn ).toHaveBeenCalledWith(
			'release/23.5',
			expect.objectContaining( { releaseId: 'run-456' } )
		);
		expect( updatePackagesFn ).toHaveBeenCalled();
		expect( preparePackagesForNpmFn ).toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );
} );

describe( 'preparePackagesForNpm', () => {
	const getTestConfig = ( releaseType ) => ( {
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
			'npx lerna version patch --no-private --no-push --yes',
			'latest',
			'wp/latest',
		],
		[
			'next',
			'npx lerna version prepatch --preid next.v.',
			'next',
			'wp/next',
		],
		[
			'bugfix',
			'npx lerna version patch --no-private --no-push --yes',
			'latest',
			'wp/latest',
		],
		[
			'wp',
			'npx lerna version patch --no-private --no-push --yes',
			'wp-6.9',
			'wp/6.9',
		],
	] )(
		'prepares durable Git metadata for %s releases',
		async ( releaseType, versionCommand, distTag, npmReleaseBranch ) => {
			const commandFn = jest.fn().mockResolvedValue();
			const git = {
				revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
			};
			const releasePackages = [
				{
					name: '@wordpress/a11y',
					tagName: '@wordpress/a11y@4.50.0',
					version: '4.50.0',
				},
			];
			const pushNpmReleaseGitMetadataFn = jest.fn();
			const config = {
				...getTestConfig( releaseType ),
				distTag,
				npmReleaseBranch,
			};

			await expect(
				preparePackagesForNpm( config, {
					commandFn,
					getNpmReleasePackagesFn: jest
						.fn()
						.mockResolvedValue( releasePackages ),
					git,
					pushNpmReleaseGitMetadataFn,
				} )
			).resolves.toEqual( {
				publishCommit: 'publish-sha',
				releasePackages,
			} );

			expect( commandFn ).toHaveBeenCalledWith( 'npm ci', {
				cwd: '/repo',
			} );
			expect(
				commandFn.mock.calls.some( ( [ command ] ) =>
					command.startsWith( 'npm whoami' )
				)
			).toBe( false );
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
			expect( pushNpmReleaseGitMetadataFn ).toHaveBeenCalledWith( {
				gitWorkingDirectoryPath: '/repo',
				npmReleaseBranch,
				packageTags: [],
				publishCommit: 'publish-sha',
			} );
			expect( console ).toHaveLogged();
		}
	);

	it( 'does not push when versioning creates no package release', async () => {
		const pushNpmReleaseGitMetadataFn = jest.fn();

		await expect(
			preparePackagesForNpm( getTestConfig( 'next' ), {
				commandFn: jest.fn().mockResolvedValue(),
				getNpmReleasePackagesFn: jest.fn().mockResolvedValue( [] ),
				git: { revparse: jest.fn() },
				pushNpmReleaseGitMetadataFn,
			} )
		).resolves.toBeUndefined();
		expect( pushNpmReleaseGitMetadataFn ).not.toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );
} );

describe( 'publishPreparedPackagesToNpm', () => {
	it( 'installs and publishes from reconstructed release state', async () => {
		const releaseState = {
			distTag: 'latest',
			isFinalized: false,
			publishCommit: 'publish-sha',
			releasePackages: [
				{
					name: '@wordpress/a11y',
					tagName: '@wordpress/a11y@4.50.0',
					version: '4.50.0',
				},
			],
		};
		const commandFn = jest.fn().mockResolvedValue();
		const publishVersionedPackagesToNpmFn = jest.fn();

		await publishPreparedPackagesToNpm(
			{
				gitWorkingDirectoryPath: '/repo',
				interactive: false,
			},
			{
				commandFn,
				getPreparedNpmReleaseStateFn: jest
					.fn()
					.mockResolvedValue( releaseState ),
				publishVersionedPackagesToNpmFn,
			}
		);

		expect( commandFn ).toHaveBeenCalledWith( 'npm ci', { cwd: '/repo' } );
		expect( commandFn ).toHaveBeenCalledWith( 'npm whoami', {
			cwd: '/repo',
			stdio: 'inherit',
		} );
		expect( publishVersionedPackagesToNpmFn ).toHaveBeenCalledWith(
			{
				distTag: 'latest',
				gitWorkingDirectoryPath: '/repo',
				noVerifyAccessFlag: '--no-verify-access',
				publishCommit: 'publish-sha',
				releasePackages: releaseState.releasePackages,
				yesFlag: '--yes',
			},
			{ commandFn }
		);
		expect( console ).toHaveLogged();
	} );

	it( 'does not publish a release that is already finalized', async () => {
		const commandFn = jest.fn();
		const publishVersionedPackagesToNpmFn = jest.fn();

		await publishPreparedPackagesToNpm(
			{
				gitWorkingDirectoryPath: '/repo',
				interactive: false,
			},
			{
				commandFn,
				getPreparedNpmReleaseStateFn: jest
					.fn()
					.mockResolvedValue( { isFinalized: true } ),
				publishVersionedPackagesToNpmFn,
			}
		);

		expect( commandFn ).not.toHaveBeenCalled();
		expect( publishVersionedPackagesToNpmFn ).not.toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );
} );

describe( 'finalizePreparedNpmRelease', () => {
	const releaseState = {
		changelogCommit: 'changelog-sha',
		distTag: 'latest',
		isFinalized: false,
		npmReleaseBranch: 'wp/latest',
		pluginReleaseBranch: 'release/23.5',
		publishCommit: 'publish-sha',
		releasePackages: [
			{
				name: '@wordpress/a11y',
				tagName: '@wordpress/a11y@4.50.0',
				version: '4.50.0',
			},
			{
				name: '@wordpress/blocks',
				tagName: '@wordpress/blocks@14.20.0',
				version: '14.20.0',
			},
		],
		releaseId: 'run-123',
		releaseType: 'latest',
	};

	it( 'does not finalize a release that is already finalized', async () => {
		const backportCommitsToBranchFn = jest.fn();
		const createNpmReleaseFinalizationMarkerFn = jest.fn();
		const getRemoteTagShasFn = jest.fn();
		const pushNpmReleaseGitMetadataFn = jest.fn();

		await finalizePreparedNpmRelease(
			{
				gitWorkingDirectoryPath: '/repo',
				releaseType: 'latest',
			},
			{
				backportCommitsToBranchFn,
				createNpmReleaseFinalizationMarkerFn,
				getPreparedNpmReleaseStateFn: jest
					.fn()
					.mockResolvedValue( { isFinalized: true } ),
				getRemoteTagShasFn,
				git: { raw: jest.fn() },
				pushNpmReleaseGitMetadataFn,
			}
		);

		expect( getRemoteTagShasFn ).not.toHaveBeenCalled();
		expect( backportCommitsToBranchFn ).not.toHaveBeenCalled();
		expect( pushNpmReleaseGitMetadataFn ).not.toHaveBeenCalled();
		expect( createNpmReleaseFinalizationMarkerFn ).not.toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );

	it( 'backports idempotently and pushes only missing final tags', async () => {
		const backportCommitsToBranchFn = jest.fn();
		const createNpmReleaseFinalizationMarkerFn = jest.fn();
		const git = { raw: jest.fn().mockResolvedValue() };
		const pushNpmReleaseGitMetadataFn = jest.fn();
		const runNpmPublishPreflightFn = jest
			.fn()
			.mockResolvedValue( [ '@wordpress/a11y', '@wordpress/blocks' ] );

		await finalizePreparedNpmRelease(
			{
				gitWorkingDirectoryPath: '/repo',
				releaseType: 'latest',
			},
			{
				backportCommitsToBranchFn,
				createNpmReleaseFinalizationMarkerFn,
				getPreparedNpmReleaseStateFn: jest
					.fn()
					.mockResolvedValue( releaseState ),
				getRemoteTagShasFn: jest
					.fn()
					.mockResolvedValue(
						new Map( [
							[ '@wordpress/a11y@4.50.0', 'publish-sha' ],
						] )
					),
				git,
				pushNpmReleaseGitMetadataFn,
				runNpmPublishPreflightFn,
			}
		);

		expect( runNpmPublishPreflightFn ).toHaveBeenCalledWith( {
			checkAccess: false,
			distTag: 'latest',
			gitWorkingDirectoryPath: '/repo',
			publishCommit: 'publish-sha',
			releasePackages: releaseState.releasePackages,
		} );
		expect( backportCommitsToBranchFn ).toHaveBeenCalledWith(
			'trunk',
			[ 'changelog-sha', 'publish-sha' ],
			expect.objectContaining( { releaseType: 'latest' } )
		);
		expect( backportCommitsToBranchFn ).toHaveBeenCalledWith(
			'release/23.5',
			[ 'changelog-sha', 'publish-sha' ],
			expect.objectContaining( { releaseType: 'latest' } )
		);
		expect( git.raw ).toHaveBeenCalledWith(
			'tag',
			'-a',
			'@wordpress/blocks@14.20.0',
			'publish-sha',
			'-m',
			'@wordpress/blocks@14.20.0'
		);
		expect( pushNpmReleaseGitMetadataFn ).toHaveBeenCalledWith( {
			gitWorkingDirectoryPath: '/repo',
			npmReleaseBranch: 'wp/latest',
			packageTags: [ '@wordpress/blocks@14.20.0' ],
			publishCommit: 'publish-sha',
		} );
		expect( createNpmReleaseFinalizationMarkerFn ).toHaveBeenCalledWith(
			releaseState,
			expect.objectContaining( { releaseType: 'latest' } )
		);
	} );

	it( 'records finalization when every final tag is already remote', async () => {
		const createNpmReleaseFinalizationMarkerFn = jest.fn();
		const pushNpmReleaseGitMetadataFn = jest.fn();
		const runNpmPublishPreflightFn = jest
			.fn()
			.mockResolvedValue( [ '@wordpress/a11y', '@wordpress/blocks' ] );

		await finalizePreparedNpmRelease(
			{
				gitWorkingDirectoryPath: '/repo',
				releaseType: 'latest',
			},
			{
				createNpmReleaseFinalizationMarkerFn,
				getPreparedNpmReleaseStateFn: jest
					.fn()
					.mockResolvedValue( releaseState ),
				getRemoteTagShasFn: jest
					.fn()
					.mockResolvedValue(
						new Map(
							releaseState.releasePackages.map(
								( { tagName } ) => [ tagName, 'publish-sha' ]
							)
						)
					),
				git: { raw: jest.fn() },
				pushNpmReleaseGitMetadataFn,
				runNpmPublishPreflightFn,
			}
		);

		expect( runNpmPublishPreflightFn ).toHaveBeenCalledWith( {
			checkAccess: false,
			distTag: 'latest',
			gitWorkingDirectoryPath: '/repo',
			publishCommit: 'publish-sha',
			releasePackages: releaseState.releasePackages,
		} );
		expect( pushNpmReleaseGitMetadataFn ).not.toHaveBeenCalled();
		expect( createNpmReleaseFinalizationMarkerFn ).toHaveBeenCalledWith(
			releaseState,
			expect.objectContaining( { releaseType: 'latest' } )
		);
		expect( console ).toHaveLogged();
	} );

	it( 'reuses local tags created by the prepare phase', async () => {
		const nextReleaseState = {
			...releaseState,
			distTag: 'next',
			npmReleaseBranch: 'wp/next',
			pluginReleaseBranch: 'trunk',
			releasePackages: [ releaseState.releasePackages[ 0 ] ],
			releaseType: 'next',
		};
		const git = {
			raw: jest.fn().mockResolvedValue( 'publish-sha\n' ),
		};

		await finalizePreparedNpmRelease(
			{
				gitWorkingDirectoryPath: '/repo',
				releaseType: 'next',
			},
			{
				createNpmReleaseFinalizationMarkerFn: jest.fn(),
				getPreparedNpmReleaseStateFn: jest
					.fn()
					.mockResolvedValue( nextReleaseState ),
				getRemoteTagShasFn: jest.fn().mockResolvedValue( new Map() ),
				git,
				pushNpmReleaseGitMetadataFn: jest.fn(),
				runNpmPublishPreflightFn: jest
					.fn()
					.mockResolvedValue( [ '@wordpress/a11y' ] ),
			}
		);

		expect( git.raw ).toHaveBeenCalledWith(
			'rev-list',
			'-n',
			'1',
			'@wordpress/a11y@4.50.0'
		);
		expect( git.raw ).not.toHaveBeenCalledWith(
			'tag',
			expect.anything(),
			expect.anything(),
			expect.anything(),
			expect.anything(),
			expect.anything()
		);
	} );
} );

describe( 'getConfig', () => {
	it( 'uses the stable GitHub Actions run ID in CI', () => {
		expect(
			getConfig(
				'latest',
				{ ci: true },
				{
					createReleaseIdFn: jest.fn(),
					githubRunId: '123456789',
				}
			)
		).toEqual(
			expect.objectContaining( {
				interactive: false,
				releaseId: '123456789',
			} )
		);
	} );

	it( 'prefers an explicit release ID', () => {
		expect(
			getConfig(
				'latest',
				{ ci: true, releaseId: 'manual-release' },
				{ githubRunId: '123456789' }
			).releaseId
		).toBe( 'manual-release' );
	} );

	it( 'requires a stable release ID outside interactive mode', () => {
		expect( () =>
			getConfig( 'latest', { ci: true }, { githubRunId: null } )
		).toThrow( 'A stable release ID is required in non-interactive mode.' );
	} );

	it( 'creates a release ID for a new interactive invocation', () => {
		expect(
			getConfig(
				'latest',
				{ ci: false },
				{
					createReleaseIdFn: jest
						.fn()
						.mockReturnValue( 'generated-release' ),
					githubRunId: null,
				}
			).releaseId
		).toBe( 'generated-release' );
	} );

	it( 'rejects release IDs that cannot be recorded unambiguously', () => {
		expect( () =>
			getConfig( 'latest', {
				ci: true,
				releaseId: 'invalid release',
			} )
		).toThrow(
			'The release ID may contain only letters, numbers, dots, underscores, and hyphens.'
		);
	} );
} );
