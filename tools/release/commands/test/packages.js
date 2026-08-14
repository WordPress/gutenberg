import {
	applyReleaseChangelogCommit,
	backportCommitsToBranch,
	finalizePreparedNpmRelease,
	getNpmReleasePackages,
	getNpmReleaseGitRecoveryCommands,
	getRemoteBranchSha,
	getRemoteTagShas,
	getTagPushCommands,
	getTagRefspec,
	prepareNpmRelease,
	publishPackagesToNpm,
	publishVersionedPackagesToNpm,
	pushNpmReleaseGitMetadata,
	runNpmPublishPreflight,
	runNpmReleasePhase,
	runPackagesRelease,
	verifyBackportedChangelogs,
	verifyRemotePackageTags,
} from '../packages';

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
			const checkoutNpmReleaseBranchFn = jest.fn();
			const findPluginReleaseBranchNameFn = jest
				.fn()
				.mockResolvedValue( 'release/23.5' );
			const runNpmReleaseBranchSyncStepFn = jest.fn();
			const updatePackagesFn = jest
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
			const backportCommitsToBranchFn = jest.fn();

			await finalizePreparedNpmRelease(
				config,
				{
					changelogCommit: 'changelog-sha',
					pluginReleaseBranch,
					publishCommit: 'publish-sha',
				},
				{ backportCommitsToBranchFn }
			);

			expect( backportCommitsToBranchFn.mock.calls ).toEqual(
				expectedBranches.map( ( branch ) => [
					branch,
					{
						changelogCommit: 'changelog-sha',
						publishCommit: 'publish-sha',
					},
					config,
				] )
			);
		}
	);

	it( 'still backports to the remaining branches when one branch fails', async () => {
		const config = { releaseType: 'latest' };
		const backportCommitsToBranchFn = jest
			.fn()
			.mockRejectedValueOnce( new Error( 'trunk cherry-pick conflict' ) )
			.mockResolvedValueOnce();

		await expect(
			finalizePreparedNpmRelease(
				config,
				{
					changelogCommit: 'changelog-sha',
					pluginReleaseBranch: 'release/23.5',
					publishCommit: 'publish-sha',
				},
				{ backportCommitsToBranchFn }
			)
		).rejects.toThrow(
			'Backporting failed for "trunk": trunk cherry-pick conflict'
		);

		expect( backportCommitsToBranchFn ).toHaveBeenCalledTimes( 2 );
		expect( backportCommitsToBranchFn.mock.calls[ 1 ][ 0 ] ).toBe(
			'release/23.5'
		);
		expect( console ).toHaveLogged();
	} );

	it( 'reports structured failure details while continuing with the remaining branches', async () => {
		const backportCommitsToBranchFn = jest
			.fn()
			.mockRejectedValueOnce( {
				code: 'GIT_CONFLICT',
				message: 'could not apply changelog commit',
			} )
			.mockResolvedValueOnce();

		await expect(
			finalizePreparedNpmRelease(
				{ releaseType: 'latest' },
				{
					changelogCommit: 'changelog-sha',
					pluginReleaseBranch: 'release/23.5',
					publishCommit: 'publish-sha',
				},
				{ backportCommitsToBranchFn }
			)
		).rejects.toThrow(
			'Backporting failed for "trunk": could not apply changelog commit (GIT_CONFLICT)'
		);

		expect( backportCommitsToBranchFn ).toHaveBeenCalledTimes( 2 );
		expect( console ).toHaveLogged();
	} );
} );

describe( 'backportCommitsToBranch', () => {
	const createGit = () => ( {
		fetch: jest.fn().mockResolvedValue(),
		push: jest.fn().mockResolvedValue(),
		raw: jest.fn().mockResolvedValue( '' ),
	} );

	const getRawCallOrder = ( git, matcher ) => {
		const callIndex = git.raw.mock.calls.findIndex( matcher );
		expect( callIndex ).toBeGreaterThan( -1 );
		return git.raw.mock.invocationCallOrder[ callIndex ];
	};

	it( 'applies the changelog commit, cherry-picks the publish commit, and verifies before pushing', async () => {
		const git = createGit();
		const applyReleaseChangelogCommitFn = jest.fn();
		const verifyBackportedChangelogsFn = jest.fn();

		await backportCommitsToBranch(
			'trunk',
			{ changelogCommit: 'changelog-sha', publishCommit: 'publish-sha' },
			{ gitWorkingDirectoryPath: '/repo', interactive: false },
			{ applyReleaseChangelogCommitFn, git, verifyBackportedChangelogsFn }
		);

		expect( git.fetch ).toHaveBeenCalledWith( 'origin', 'trunk' );
		expect( git.raw ).toHaveBeenCalledWith(
			'checkout',
			'-B',
			'trunk',
			'origin/trunk'
		);
		expect( git.raw ).toHaveBeenCalledWith(
			'reset',
			'--hard',
			'origin/trunk'
		);
		expect( applyReleaseChangelogCommitFn ).toHaveBeenCalledWith(
			{
				changelogCommit: 'changelog-sha',
				gitWorkingDirectoryPath: '/repo',
			},
			{ git }
		);
		expect( git.raw ).toHaveBeenCalledWith(
			'-c',
			'rerere.enabled=false',
			'cherry-pick',
			'publish-sha'
		);
		expect( verifyBackportedChangelogsFn ).toHaveBeenCalledWith(
			{
				branchName: 'trunk',
				gitWorkingDirectoryPath: '/repo',
				releaseCommit: 'publish-sha',
			},
			{ git }
		);
		expect( git.push ).toHaveBeenCalledWith( 'origin', 'trunk' );
		expect(
			getRawCallOrder( git, ( args ) => args.includes( 'checkout' ) )
		).toBeLessThan(
			applyReleaseChangelogCommitFn.mock.invocationCallOrder[ 0 ]
		);
		expect(
			applyReleaseChangelogCommitFn.mock.invocationCallOrder[ 0 ]
		).toBeLessThan(
			getRawCallOrder( git, ( args ) => args.includes( 'cherry-pick' ) )
		);
		expect(
			verifyBackportedChangelogsFn.mock.invocationCallOrder[ 0 ]
		).toBeLessThan( git.push.mock.invocationCallOrder[ 0 ] );
		expect( console ).toHaveLogged();
	} );

	it( 'verifies against the changelog commit when there is no publish commit', async () => {
		const git = createGit();
		const applyReleaseChangelogCommitFn = jest.fn();
		const verifyBackportedChangelogsFn = jest.fn();

		await backportCommitsToBranch(
			'trunk',
			{ changelogCommit: 'changelog-sha', publishCommit: undefined },
			{ gitWorkingDirectoryPath: '/repo', interactive: false },
			{ applyReleaseChangelogCommitFn, git, verifyBackportedChangelogsFn }
		);

		expect(
			git.raw.mock.calls.some( ( args ) =>
				args.includes( 'cherry-pick' )
			)
		).toBe( false );
		expect( verifyBackportedChangelogsFn ).toHaveBeenCalledWith(
			expect.objectContaining( { releaseCommit: 'changelog-sha' } ),
			{ git }
		);
		expect( console ).toHaveLogged();
	} );

	it( 'does nothing when there are no commits to backport', async () => {
		const git = createGit();

		await backportCommitsToBranch(
			'trunk',
			{ changelogCommit: undefined, publishCommit: undefined },
			{ gitWorkingDirectoryPath: '/repo', interactive: false },
			{ git }
		);

		expect( git.fetch ).not.toHaveBeenCalled();
		expect( git.push ).not.toHaveBeenCalled();
	} );

	it( 'does not push and restores the working copy when verification fails', async () => {
		const git = createGit();
		const applyReleaseChangelogCommitFn = jest.fn();
		const verifyBackportedChangelogsFn = jest
			.fn()
			.mockRejectedValue(
				new Error( 'Released changelog sections on "trunk" differ' )
			);

		await expect(
			backportCommitsToBranch(
				'trunk',
				{
					changelogCommit: 'changelog-sha',
					publishCommit: 'publish-sha',
				},
				{ gitWorkingDirectoryPath: '/repo', interactive: false },
				{
					applyReleaseChangelogCommitFn,
					git,
					verifyBackportedChangelogsFn,
				}
			)
		).rejects.toThrow( 'Released changelog sections on "trunk" differ' );

		expect( git.push ).not.toHaveBeenCalled();
		expect( git.raw ).toHaveBeenCalledWith( 'cherry-pick', '--abort' );
		// The cleanup reset is in place, unlike the targeted reset that syncs
		// the branch to the remote tip during setup.
		expect( git.raw ).toHaveBeenCalledWith( 'reset', '--hard' );
		expect( console ).toHaveLogged();
	} );

	it( 'does not push and cleans the working copy when the branch setup fails', async () => {
		const git = createGit();
		git.raw.mockImplementation( async ( ...args ) => {
			if ( args[ 0 ] === 'checkout' && args[ 1 ] === '-B' ) {
				throw new Error( 'cannot update the branch ref' );
			}
			return '';
		} );
		const verifyBackportedChangelogsFn = jest.fn();

		await expect(
			backportCommitsToBranch(
				'trunk',
				{
					changelogCommit: 'changelog-sha',
					publishCommit: 'publish-sha',
				},
				{ gitWorkingDirectoryPath: '/repo', interactive: false },
				{
					applyReleaseChangelogCommitFn: jest.fn(),
					git,
					verifyBackportedChangelogsFn,
				}
			)
		).rejects.toThrow( 'cannot update the branch ref' );

		expect( git.push ).not.toHaveBeenCalled();
		expect( verifyBackportedChangelogsFn ).not.toHaveBeenCalled();
		expect( git.raw ).toHaveBeenCalledWith( 'reset', '--hard' );
		expect( console ).toHaveLogged();
	} );

	it( 'reports both the backport and cleanup failures when reset fails', async () => {
		const git = createGit();
		git.raw.mockImplementation( async ( ...args ) => {
			// Only the in-place cleanup reset fails; the setup reset targeting
			// the remote tip succeeds.
			if ( args[ 0 ] === 'reset' && args.length === 2 ) {
				throw { code: 'LOCKED', message: 'cannot lock index' };
			}
			return '';
		} );

		await expect(
			backportCommitsToBranch(
				'trunk',
				{
					changelogCommit: 'changelog-sha',
					publishCommit: 'publish-sha',
				},
				{ gitWorkingDirectoryPath: '/repo', interactive: false },
				{
					applyReleaseChangelogCommitFn: jest.fn(),
					git,
					verifyBackportedChangelogsFn: jest
						.fn()
						.mockRejectedValue(
							new Error( 'verification failed' )
						),
				}
			)
		).rejects.toThrow(
			'Backporting to "trunk" failed, and cleaning the working copy also failed: cannot lock index (LOCKED). Original failure: verification failed'
		);

		expect( git.push ).not.toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );
} );

describe( 'applyReleaseChangelogCommit', () => {
	const RELEASE_BASE = `# Changelog

## Unreleased

### Bug Fixes

-   Shipped fix. ([#1](https://github.com/WordPress/gutenberg/pull/1))

## 17.9.0 (2026-07-29)
`;
	const PUBLISHED = RELEASE_BASE.replace(
		'## Unreleased',
		'## Unreleased\n\n## 18.0.0 (2026-08-12)'
	);
	const BRANCH = RELEASE_BASE.replace(
		'-   Shipped fix. ([#1](https://github.com/WordPress/gutenberg/pull/1))',
		'-   Shipped fix. ([#1](https://github.com/WordPress/gutenberg/pull/1))\n' +
			'-   Landed during publish. ([#9](https://github.com/WordPress/gutenberg/pull/9))'
	);

	const createGit = ( { cherryPickError, unmergedPaths = [] } = {} ) => ( {
		raw: jest.fn( async ( ...args ) => {
			const command = args.join( ' ' );
			if ( command === 'diff --name-only changelog-sha^ changelog-sha' ) {
				return 'packages/data/CHANGELOG.md\npackages/data/package.json\n';
			}
			if (
				command ===
				'-c rerere.enabled=false cherry-pick --no-commit changelog-sha'
			) {
				if ( cherryPickError ) {
					throw cherryPickError;
				}
				return '';
			}
			if ( command === 'diff --name-only --diff-filter=U' ) {
				return unmergedPaths.join( '\n' ) + '\n';
			}
			if (
				command === 'show changelog-sha^:packages/data/CHANGELOG.md'
			) {
				return RELEASE_BASE;
			}
			if ( command === 'show changelog-sha:packages/data/CHANGELOG.md' ) {
				return PUBLISHED;
			}
			if ( command === 'show HEAD:packages/data/CHANGELOG.md' ) {
				return BRANCH;
			}
			return '';
		} ),
	} );

	it( 'recomputes the released changelogs and commits with the original metadata', async () => {
		const git = createGit();
		const writeFileFn = jest.fn();

		await applyReleaseChangelogCommit(
			{
				changelogCommit: 'changelog-sha',
				gitWorkingDirectoryPath: '/repo',
			},
			{ git, writeFileFn }
		);

		expect( writeFileFn ).toHaveBeenCalledTimes( 1 );
		const [ writtenPath, writtenContent ] = writeFileFn.mock.calls[ 0 ];
		expect( writtenPath ).toBe( '/repo/packages/data/CHANGELOG.md' );
		// The entry that landed on the target branch during publication stays
		// under `## Unreleased` instead of the published version section.
		expect( writtenContent ).toContain( `## Unreleased

### Bug Fixes

-   Landed during publish. ([#9](https://github.com/WordPress/gutenberg/pull/9))

## 18.0.0 (2026-08-12)
` );
		expect( git.raw ).toHaveBeenCalledWith(
			'add',
			'--',
			'packages/data/CHANGELOG.md'
		);
		expect( git.raw ).toHaveBeenCalledWith(
			'commit',
			'-C',
			'changelog-sha'
		);
	} );

	it( 'continues past cherry-pick conflicts limited to package changelogs', async () => {
		const git = createGit( {
			cherryPickError: new Error( 'could not apply changelog-sha' ),
			unmergedPaths: [ 'packages/data/CHANGELOG.md' ],
		} );
		const writeFileFn = jest.fn();

		await applyReleaseChangelogCommit(
			{
				changelogCommit: 'changelog-sha',
				gitWorkingDirectoryPath: '/repo',
			},
			{ git, writeFileFn }
		);

		expect( writeFileFn ).toHaveBeenCalledTimes( 1 );
		expect( git.raw ).toHaveBeenCalledWith(
			'commit',
			'-C',
			'changelog-sha'
		);
	} );

	it( 'fails when the cherry-pick conflicts outside package changelogs', async () => {
		const git = createGit( {
			cherryPickError: new Error( 'could not apply changelog-sha' ),
			unmergedPaths: [ 'packages/data/package.json' ],
		} );
		const writeFileFn = jest.fn();

		await expect(
			applyReleaseChangelogCommit(
				{
					changelogCommit: 'changelog-sha',
					gitWorkingDirectoryPath: '/repo',
				},
				{ git, writeFileFn }
			)
		).rejects.toThrow(
			'Cherry-picking changelog-sha conflicted outside package changelogs (packages/data/package.json); resolve the backport manually.'
		);

		expect( writeFileFn ).not.toHaveBeenCalled();
	} );

	it( 'rethrows cherry-pick failures that are not content conflicts', async () => {
		const git = createGit( {
			cherryPickError: new Error( 'bad object changelog-sha' ),
		} );

		await expect(
			applyReleaseChangelogCommit(
				{
					changelogCommit: 'changelog-sha',
					gitWorkingDirectoryPath: '/repo',
				},
				{ git, writeFileFn: jest.fn() }
			)
		).rejects.toThrow( 'bad object changelog-sha' );
	} );

	it( 'refuses to backport a commit that modifies no package changelogs', async () => {
		const git = {
			raw: jest.fn().mockResolvedValue( 'packages/data/package.json\n' ),
		};

		await expect(
			applyReleaseChangelogCommit(
				{
					changelogCommit: 'changelog-sha',
					gitWorkingDirectoryPath: '/repo',
				},
				{ git, writeFileFn: jest.fn() }
			)
		).rejects.toThrow(
			'Found no package changelogs modified by changelog-sha; refusing to backport it as a changelog commit.'
		);
	} );
} );

describe( 'verifyBackportedChangelogs', () => {
	const RELEASED = '## 18.0.0 (2026-08-12)\n\n-   Shipped. ([#1](x))\n';

	it( 'passes when the released sections match the release byte for byte', async () => {
		const git = {
			raw: jest.fn( async ( ...args ) => {
				if ( args[ 0 ] === 'ls-tree' ) {
					return 'packages/data/CHANGELOG.md\npackages/data/package.json\n';
				}
				if ( args[ 0 ] === 'show' ) {
					const prefix =
						args[ 1 ] === 'HEAD:packages/data/CHANGELOG.md'
							? '# Changelog\n\n## Unreleased\n\n-   New. ([#9](x))\n\n'
							: '# Changelog\n\n## Unreleased\n\n';
					return prefix + RELEASED;
				}
				return '';
			} ),
		};

		await expect(
			verifyBackportedChangelogs(
				{
					branchName: 'trunk',
					gitWorkingDirectoryPath: '/repo',
					releaseCommit: 'publish-sha',
				},
				{ git }
			)
		).resolves.toBeUndefined();

		expect( git.raw ).toHaveBeenCalledWith(
			'ls-tree',
			'-r',
			'--name-only',
			'publish-sha',
			'--',
			'packages'
		);
	} );

	it( 'fails when an entry moved into a published version section', async () => {
		const git = {
			raw: jest.fn( async ( ...args ) => {
				if ( args[ 0 ] === 'ls-tree' ) {
					return 'packages/data/CHANGELOG.md\n';
				}
				if ( args[ 1 ] === 'HEAD:packages/data/CHANGELOG.md' ) {
					return (
						'# Changelog\n\n## Unreleased\n\n' +
						'## 18.0.0 (2026-08-12)\n\n-   Landed during publish. ([#9](x))\n-   Shipped. ([#1](x))\n'
					);
				}
				return '# Changelog\n\n## Unreleased\n\n' + RELEASED;
			} ),
		};

		await expect(
			verifyBackportedChangelogs(
				{
					branchName: 'trunk',
					gitWorkingDirectoryPath: '/repo',
					releaseCommit: 'publish-sha',
				},
				{ git }
			)
		).rejects.toThrow(
			'Released changelog sections on "trunk" do not match the published release for:\n' +
				'  - packages/data/CHANGELOG.md\n' +
				'An entry moved into or out of a published version section. The backport was not pushed.'
		);
	} );

	it( 'fails loudly when it finds no changelogs to verify', async () => {
		const git = { raw: jest.fn().mockResolvedValue( '\n' ) };

		await expect(
			verifyBackportedChangelogs(
				{
					branchName: 'trunk',
					gitWorkingDirectoryPath: '/repo',
					releaseCommit: 'publish-sha',
				},
				{ git }
			)
		).rejects.toThrow(
			'Found no package changelogs in publish-sha to verify; refusing to push the backport to "trunk".'
		);
	} );

	it( 'skips changelogs that have never published a release', async () => {
		const git = {
			raw: jest.fn( async ( ...args ) => {
				if ( args[ 0 ] === 'ls-tree' ) {
					return 'packages/connectors/CHANGELOG.md\npackages/data/CHANGELOG.md\n';
				}
				if (
					args[ 1 ].endsWith( 'packages/connectors/CHANGELOG.md' )
				) {
					return '# Changelog\n\n## Unreleased\n';
				}
				return '# Changelog\n\n## Unreleased\n\n' + RELEASED;
			} ),
		};

		await expect(
			verifyBackportedChangelogs(
				{
					branchName: 'trunk',
					gitWorkingDirectoryPath: '/repo',
					releaseCommit: 'publish-sha',
				},
				{ git }
			)
		).resolves.toBeUndefined();

		expect( console ).toHaveLogged();
	} );

	it( 'propagates failures reading a changelog that exists on the target branch', async () => {
		const git = {
			raw: jest.fn( async ( ...args ) => {
				if ( args[ 0 ] === 'ls-tree' ) {
					return 'packages/data/CHANGELOG.md\n';
				}
				if ( args[ 1 ] === 'HEAD:packages/data/CHANGELOG.md' ) {
					throw new Error( 'unable to read object' );
				}
				return '# Changelog\n\n## Unreleased\n\n' + RELEASED;
			} ),
		};

		await expect(
			verifyBackportedChangelogs(
				{
					branchName: 'trunk',
					gitWorkingDirectoryPath: '/repo',
					releaseCommit: 'publish-sha',
				},
				{ git }
			)
		).rejects.toThrow( 'unable to read object' );
	} );

	it( 'skips changelogs that do not exist on the target branch', async () => {
		const git = {
			raw: jest.fn( async ( ...args ) => {
				if ( args[ 0 ] === 'ls-tree' ) {
					return args[ 3 ] === 'HEAD'
						? ''
						: 'packages/removed/CHANGELOG.md\n';
				}
				return '# Changelog\n\n## Unreleased\n\n' + RELEASED;
			} ),
		};

		await expect(
			verifyBackportedChangelogs(
				{
					branchName: 'trunk',
					gitWorkingDirectoryPath: '/repo',
					releaseCommit: 'publish-sha',
				},
				{ git }
			)
		).resolves.toBeUndefined();

		expect( console ).toHaveLogged();
	} );
} );

describe( 'runPackagesRelease', () => {
	it( 'runs the release lifecycle in order', async () => {
		const config = {
			gitWorkingDirectoryPath: '/repo',
			interactive: false,
		};
		const releaseState = { changelogCommit: 'changelog-sha' };
		const prepareNpmReleaseFn = jest.fn().mockResolvedValue( releaseState );
		const publishPreparedPackagesToNpmFn = jest
			.fn()
			.mockResolvedValue( 'publish-sha' );
		const finalizePreparedNpmReleaseFn = jest.fn();

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
	// npm whoami output, intentionally padded to verify it is trimmed.
	const WHOAMI = { stdout: 'wp-user\n' };

	it( 'verifies npm authentication before checking registry state', async () => {
		const commandFn = jest
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
		const commandFn = jest.fn().mockRejectedValueOnce(
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
		const commandFn = jest
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
		const commandFn = jest
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
		const commandFn = jest
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
		const commandFn = jest
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
		const commandFn = jest
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
	it( 'preflights, publishes from package, and pushes metadata', async () => {
		const commandFn = jest.fn().mockResolvedValue();
		const getNpmReleasePackagesFn = jest
			.fn()
			.mockResolvedValue( [
				{ name: '@wordpress/a11y', tagName: '@wordpress/a11y@4.50.0' },
			] );
		const runNpmPublishPreflightFn = jest
			.fn()
			.mockResolvedValueOnce( [] )
			.mockResolvedValueOnce( [ '@wordpress/a11y' ] );
		const pushNpmReleaseGitMetadataFn = jest.fn();
		const git = {
			revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
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
			'npx lerna publish from-package --dist-tag latest --git-head publish-sha --yes --no-verify-access',
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
			revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
			reset: jest.fn(),
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
				getNpmReleasePackagesFn: jest.fn().mockResolvedValue( [
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
				pushNpmReleaseGitMetadataFn: jest.fn(),
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
		const commandFn = jest.fn();
		const git = {
			revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
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
				getNpmReleasePackagesFn: jest.fn().mockResolvedValue( [
					{
						name: '@wordpress/a11y',
						tagName: '@wordpress/a11y@4.50.0',
					},
				] ),
				git,
				pushNpmReleaseGitMetadataFn: jest.fn(),
				runNpmPublishPreflightFn: jest
					.fn()
					.mockResolvedValue( [ '@wordpress/a11y' ] ),
			}
		);

		expect( commandFn ).not.toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );

	it( 'does not push metadata when final registry verification is incomplete', async () => {
		const commandFn = jest.fn().mockResolvedValue();
		const pushNpmReleaseGitMetadataFn = jest.fn();
		const runNpmPublishPreflightFn = jest.fn().mockResolvedValue( [] );
		const runPhase = jest.fn( async ( _label, task ) => task() );
		const git = {
			revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
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
					getNpmReleasePackagesFn: jest.fn().mockResolvedValue( [
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
			expect.any( Function )
		);
		expect( pushNpmReleaseGitMetadataFn ).not.toHaveBeenCalled();
		expect( console ).toHaveLogged();
	} );

	it( 'retries final registry verification after propagation lag', async () => {
		const commandFn = jest.fn().mockResolvedValue();
		const pushNpmReleaseGitMetadataFn = jest.fn();
		const runNpmPublishPreflightFn = jest
			.fn()
			.mockResolvedValueOnce( [] )
			.mockResolvedValueOnce( [] )
			.mockResolvedValueOnce( [ '@wordpress/a11y' ] );
		const wait = jest.fn();
		const runPhase = ( label, task ) =>
			runNpmReleasePhase( label, task, { wait } );
		const git = {
			revparse: jest.fn().mockResolvedValue( 'publish-sha' ),
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
				getNpmReleasePackagesFn: jest.fn().mockResolvedValue( [
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
		'routes %s releases through the shared metadata publishing path',
		async ( releaseType, versionCommand, distTag, npmReleaseBranch ) => {
			const commandFn = jest.fn().mockResolvedValue();
			const git = {
				revparse: jest
					.fn()
					.mockResolvedValueOnce( 'before-sha' )
					.mockResolvedValueOnce( 'after-sha' ),
			};
			const publishVersionedPackagesToNpmFn = jest.fn();
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
				yesFlag: '--yes',
			} );
			expect( console ).toHaveLogged();
		}
	);
} );
