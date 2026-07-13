/**
 * Internal dependencies
 */
import {
	getNpmReleasePackages,
	getNpmReleaseGitRecoveryCommands,
	getRemoteBranchSha,
	getRemoteTagShas,
	getTagPushCommands,
	getTagRefspec,
	pushNpmReleaseGitMetadata,
	runNpmPublishPreflight,
	runNpmReleaseGitPushPhase,
	verifyRemotePackageTags,
} from '../packages';

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
	it( 'uses the npm access command supported by current npm versions', async () => {
		const commandFn = jest
			.fn()
			.mockResolvedValueOnce()
			.mockRejectedValueOnce( {
				stderr: 'npm ERR! code E404',
			} );

		await runNpmPublishPreflight(
			{
				gitWorkingDirectoryPath: '/repo',
				releasePackages: [
					{ name: '@wordpress/a11y', version: '4.50.0' },
				],
			},
			{ commandFn }
		);

		expect( commandFn ).toHaveBeenNthCalledWith(
			1,
			'npm access list packages @wordpress --json',
			{ cwd: '/repo', stdio: 'pipe' }
		);
		expect( commandFn ).toHaveBeenNthCalledWith(
			2,
			'npm view @wordpress/a11y@4.50.0 version --json',
			{ cwd: '/repo', stdio: 'pipe' }
		);
		expect( console ).toHaveLogged();
	} );

	it( 'fails when a target package version already exists', async () => {
		const commandFn = jest.fn().mockResolvedValue();

		await expect(
			runNpmPublishPreflight(
				{
					gitWorkingDirectoryPath: '/repo',
					releasePackages: [
						{ name: '@wordpress/a11y', version: '4.50.0' },
					],
				},
				{ commandFn }
			)
		).rejects.toThrow(
			'@wordpress/a11y@4.50.0 already exists in the npm registry.'
		);
		expect( console ).toHaveLogged();
	} );
} );

describe( 'runNpmReleaseGitPushPhase', () => {
	it( 'retries a failed phase before surfacing success', async () => {
		const task = jest
			.fn()
			.mockRejectedValueOnce( new Error( 'transient failure' ) )
			.mockResolvedValueOnce();
		const wait = jest.fn();

		await runNpmReleaseGitPushPhase( 'Package tag push', task, { wait } );

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
