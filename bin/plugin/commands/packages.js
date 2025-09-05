/**
 * External dependencies
 */
const { command } = require( 'execa' );
const path = require( 'path' );
const glob = require( 'fast-glob' );
const fs = require( 'fs' );
const { inc: semverInc } = require( 'semver' );
const { rimraf } = require( 'rimraf' );
const readline = require( 'readline' );
const SimpleGit = require( 'simple-git' );

/**
 * Internal dependencies
 */
const { log, formats } = require( '../lib/logger' );
const {
	askForConfirmation,
	runStep,
	readJSONFile,
	getRandomTemporaryPath,
} = require( '../lib/utils' );
const {
	calculateVersionBumpFromChangelog,
	findPluginReleaseBranchName,
} = require( './common' );
const { join } = require( 'path' );
const pluginConfig = require( '../config' );

/**
 * Release type names.
 *
 * @typedef {('latest'|'bugfix'|'patch'|'next')} ReleaseType
 */

/**
 * Semantic Versioning labels.
 *
 * @typedef {('major'|'minor'|'patch')} SemVer
 */

/**
 * @typedef WPPackagesCommandOptions
 *
 * @property {boolean} [ci]             Disables interactive mode when executed in CI mode.
 * @property {string}  [repositoryPath] Relative path to the git repository.
 * @property {SemVer}  [semver]         The selected semantic versioning. Defaults to `patch`.
 * @property {string}  [wpVersion]      The major WordPress version number, example: `6.0`.
 */

/**
 * @typedef WPPackagesConfig
 *
 * @property {string}      abortMessage            Abort Message.
 * @property {string}      distTag                 The dist-tag used for npm publishing.
 * @property {string}      gitWorkingDirectoryPath Git working directory path.
 * @property {boolean}     interactive             Whether to run in interactive mode.
 * @property {SemVer}      minimumVersionBump      The selected minimum version bump.
 * @property {string}      npmReleaseBranch        The selected branch for npm release.
 * @property {ReleaseType} releaseType             The selected release type.
 */

/**
 * Checks out the npm release branch.
 *
 * @param {WPPackagesConfig} options The config object.
 */
async function checkoutNpmReleaseBranch( {
	gitWorkingDirectoryPath,
	npmReleaseBranch,
} ) {
	/*
	 * Create the release branch.
	 *
	 * Note that we are grabbing an arbitrary depth of commits (999) during the fetch.
	 * When Lerna attempts to determine if a package needs an update, it looks at
	 * `git` history to find the commit created during the previous npm publishing.
	 * Lerna assumes that all packages need publishing if it can't access
	 * the necessary information.
	 */
	await SimpleGit( gitWorkingDirectoryPath )
		.fetch( 'origin', npmReleaseBranch, [ '--depth=999' ] )
		.checkout( npmReleaseBranch );
	log(
		'>> The local npm release branch ' +
			formats.success( npmReleaseBranch ) +
			' has been successfully checked out.'
	);
}

/**
 * Checks out the npm release branch and syncs it with the changes from
 * the last plugin release.
 *
 * @param {string}           pluginReleaseBranch The plugin release branch name.
 * @param {WPPackagesConfig} config              The config object.
 *
 * @return {?string}   The optional commit's hash when branch synced.
 */
async function runNpmReleaseBranchSyncStep( pluginReleaseBranch, config ) {
	const {
		abortMessage,
		interactive,
		gitWorkingDirectoryPath,
		npmReleaseBranch,
	} = config;
	await runStep( 'Syncing the npm release branch', abortMessage, async () => {
		await checkoutNpmReleaseBranch( config );

		if ( interactive ) {
			await askForConfirmation(
				`The branch is ready for sync with the latest plugin release changes applied to "${ pluginReleaseBranch }". Proceed?`,
				true,
				abortMessage
			);
		}

		log(
			`>> Syncing the latest plugin release to "${ pluginReleaseBranch }".`
		);

		const repo = SimpleGit( gitWorkingDirectoryPath );

		/*
		 * Replace content from remote branch.
		 *
		 * @todo What is our goal here? Could `git reset --hard origin/${pluginReleaseBranch}` work?
		 *        Why are we manually removing and then adding files back in?
		 */
		await repo
			.raw( 'rm', '-r', '.' )
			.fetch( 'origin', pluginReleaseBranch, [ '--depth=1' ] )
			.raw( 'checkout', `origin/${ pluginReleaseBranch }`, '--', '.' );

		const { commit: commitHash } = await repo.commit(
			`Merge changes published in the Gutenberg plugin "${ pluginReleaseBranch }" branch`
		);

		if ( commitHash ) {
			await runPushGitChangesStep( config );
		}

		log(
			'>> The local npm release branch ' +
				formats.success( npmReleaseBranch ) +
				' has been successfully synced.'
		);
	} );
}

/**
 * Update CHANGELOG files with the new version number for those packages that
 * contain new entries.
 *
 * @param {WPPackagesConfig} config Command config.
 *
 * @return {?string}   The optional commit's hash when changelog files updated.
 */
async function updatePackages( config ) {
	const {
		abortMessage,
		gitWorkingDirectoryPath,
		interactive,
		minimumVersionBump,
		releaseType,
	} = config;

	if ( releaseType === 'wp' ) {
		log(
			'>> Skipping CHANGELOG files processing when targeting WordPress core.'
		);
		return;
	}

	const changelogFiles = await glob(
		path.resolve( gitWorkingDirectoryPath, 'packages/*/CHANGELOG.md' )
	);
	const changelogFilesPublicPackages = changelogFiles.filter(
		( changelogPath ) => {
			const pkg = require(
				path.join( path.dirname( changelogPath ), 'package.json' )
			);
			return pkg.private !== true;
		}
	);

	const processedPackages = await Promise.all(
		changelogFilesPublicPackages.map( async ( changelogPath ) => {
			const fileStream = fs.createReadStream( changelogPath );

			const rl = readline.createInterface( {
				input: fileStream,
			} );
			const lines = [];
			for await ( const line of rl ) {
				lines.push( line );
			}

			let versionBump = calculateVersionBumpFromChangelog(
				lines,
				minimumVersionBump
			);
			const packageName = `@wordpress/${
				changelogPath.split( '/' ).reverse()[ 1 ]
			}`;
			// Enforce version bump for all packages when
			// the stable minor or major version bump requested.
			if (
				! versionBump &&
				releaseType !== 'next' &&
				minimumVersionBump !== 'patch'
			) {
				versionBump = minimumVersionBump;
			}
			const packageJSONPath = changelogPath.replace(
				'CHANGELOG.md',
				'package.json'
			);
			const { version } = readJSONFile( packageJSONPath );
			const nextVersion =
				versionBump !== null ? semverInc( version, versionBump ) : null;

			return {
				changelogPath,
				packageJSONPath,
				packageName,
				nextVersion,
				version,
			};
		} )
	);

	const packagesToUpdate = processedPackages.filter(
		( { nextVersion } ) => nextVersion
	);

	if ( packagesToUpdate.length === 0 ) {
		log( '>> No changes in CHANGELOG files detected.' );
		return;
	}

	log(
		'>> Recommended version bumps based on the changes detected in CHANGELOG files:'
	);

	// e.g. "2022-11-01T00:13:26.102Z" -> "2022-11-01"
	const publishDate = new Date().toISOString().split( 'T' )[ 0 ];
	await Promise.all(
		packagesToUpdate.map(
			async ( {
				changelogPath,
				packageJSONPath,
				packageName,
				nextVersion,
				version,
			} ) => {
				// Update changelog.
				const content = fs.readFileSync( changelogPath, 'utf8' );
				fs.writeFileSync(
					changelogPath,
					content.replace(
						'## Unreleased',
						`## Unreleased\n\n## ${
							releaseType === 'next'
								? nextVersion + '-next.0'
								: nextVersion
						} (${ publishDate })`
					)
				);

				// Update package.json.
				const packageJson = readJSONFile( packageJSONPath );
				const newPackageJson = {
					...packageJson,
					version: nextVersion + '-prerelease',
				};
				fs.writeFileSync(
					packageJSONPath,
					JSON.stringify( newPackageJson, null, '\t' ) + '\n'
				);

				log(
					`   - ${ packageName }: ${ version } -> ${
						releaseType === 'next'
							? nextVersion + '-next.0'
							: nextVersion
					}`
				);
			}
		)
	);

	if ( interactive ) {
		await askForConfirmation(
			`All corresponding files were updated. Commit the changes?`,
			true,
			abortMessage
		);
	}

	const { commit: commitHash } = await SimpleGit( gitWorkingDirectoryPath )
		.add( [ './*' ] )
		.commit( 'Update changelog files' );

	if ( commitHash ) {
		await runPushGitChangesStep( config );
	}

	log( '>> Changelog files have been updated successfully.' );

	return commitHash;
}

/**
 * Push the local Git Changes the remote repository.
 *
 * @param {WPPackagesConfig} config Command config.
 */
async function runPushGitChangesStep( {
	gitWorkingDirectoryPath,
	interactive,
	npmReleaseBranch,
} ) {
	const abortMessage = `Aborting! Make sure to push changes applied to npm release branch "${ npmReleaseBranch }" manually.`;
	await runStep( 'Pushing the release branch', abortMessage, async () => {
		if ( interactive ) {
			await askForConfirmation(
				'The release branch is going to be pushed to the remote repository. Continue?',
				true,
				abortMessage
			);
		}
		await SimpleGit( gitWorkingDirectoryPath ).push(
			'origin',
			npmReleaseBranch
		);
	} );
}

/**
 * Publishes all changed packages to npm.
 *
 * @param {WPPackagesConfig} config Command config.
 *
 * @return {?string} The optional commit's hash when packages published to npm.
 */
async function publishPackagesToNpm( {
	distTag,
	gitWorkingDirectoryPath,
	interactive,
	minimumVersionBump,
	releaseType,
} ) {
	log( '>> Installing npm packages.' );
	await command( 'npm ci', {
		cwd: gitWorkingDirectoryPath,
	} );

	log( '>> Current npm user:' );
	await command( 'npm whoami', {
		cwd: gitWorkingDirectoryPath,
		stdio: 'inherit',
	} );

	const beforeCommitHash = await SimpleGit(
		gitWorkingDirectoryPath
	).revparse( [ '--short', 'HEAD' ] );

	const yesFlag = interactive ? '' : '--yes';
	const noVerifyAccessFlag = interactive ? '' : '--no-verify-access';
	if ( releaseType === 'next' ) {
		log(
			'>> Bumping version of public packages changed since the last release.'
		);

		await command(
			`npx lerna version pre${ minimumVersionBump } --preid next.${ beforeCommitHash } --no-private ${ yesFlag }`,
			{
				cwd: gitWorkingDirectoryPath,
				stdio: 'inherit',
			}
		);

		log( '>> Publishing modified packages to npm.' );
		await command(
			`npx lerna publish from-package --dist-tag ${ distTag } ${ yesFlag } ${ noVerifyAccessFlag }`,
			{
				cwd: gitWorkingDirectoryPath,
				stdio: 'inherit',
			}
		);
	} else if ( [ 'bugfix', 'wp' ].includes( releaseType ) ) {
		log( '>> Publishing modified packages to npm.' );
		try {
			await command(
				`npx lerna publish ${ minimumVersionBump } --dist-tag ${ distTag } --no-private ${ yesFlag } ${ noVerifyAccessFlag }`,
				{
					cwd: gitWorkingDirectoryPath,
					stdio: 'inherit',
				}
			);
		} catch {
			log(
				'>> Trying to finish failed publishing of modified npm packages.'
			);
			await SimpleGit( gitWorkingDirectoryPath ).reset( 'hard' );
			await command(
				`npx lerna publish from-package --dist-tag ${ distTag } ${ yesFlag } ${ noVerifyAccessFlag }`,
				{
					cwd: gitWorkingDirectoryPath,
					stdio: 'inherit',
				}
			);
		}
	} else {
		log(
			'>> Bumping version of public packages changed since the last release.'
		);
		await command(
			`npx lerna version ${ minimumVersionBump } --no-private ${ yesFlag }`,
			{
				cwd: gitWorkingDirectoryPath,
				stdio: 'inherit',
			}
		);

		log( '>> Publishing modified packages to npm.' );
		try {
			await command(
				`npx lerna publish from-package ${ yesFlag } ${ noVerifyAccessFlag }`,
				{
					cwd: gitWorkingDirectoryPath,
					stdio: 'inherit',
				}
			);
		} catch {
			log(
				'>> Trying to finish failed publishing of modified npm packages.'
			);
			await SimpleGit( gitWorkingDirectoryPath ).reset( 'hard' );
			await command(
				`npx lerna publish from-package ${ yesFlag } ${ noVerifyAccessFlag }`,
				{
					cwd: gitWorkingDirectoryPath,
					stdio: 'inherit',
				}
			);
		}
	}

	const afterCommitHash = await SimpleGit( gitWorkingDirectoryPath ).revparse(
		[ '--short', 'HEAD' ]
	);
	if ( afterCommitHash === beforeCommitHash ) {
		return;
	}

	return afterCommitHash;
}

/**
 * Backports commits from the release branch to the selected branch.
 *
 * @param {string}           branchName Selected branch name.
 * @param {string[]}         commits    The list of commits to backport.
 * @param {WPPackagesConfig} config     Command config.
 */
async function backportCommitsToBranch(
	branchName,
	commits,
	{ abortMessage, gitWorkingDirectoryPath, interactive }
) {
	if ( commits.length === 0 ) {
		return;
	}

	if ( interactive ) {
		await askForConfirmation(
			`Commits are going to be backported to "${ branchName }". Continue?`,
			true,
			abortMessage
		);
	}

	log( `>> Backporting commits to "${ branchName }".` );

	const repo = SimpleGit( gitWorkingDirectoryPath );

	/*
	 * Reset any local changes and replace them with the origin branch's copy.
	 *
	 * Perform an additional fetch to ensure that when we push our changes that
	 * it's very unlikely that new commits could have appeared at the origin
	 * HEAD between when we started running this script and now when we're
	 * pushing our changes back upstream.
	 */
	await repo.fetch().checkout( branchName ).pull( 'origin', branchName );

	for ( const commitHash of commits ) {
		await repo.raw( 'cherry-pick', commitHash );
	}

	await repo.push( 'origin', branchName );

	log( `>> Backporting successfully finished.` );
}

/**
 * Runs WordPress packages release.
 *
 * @param {WPPackagesConfig} config         Command config.
 * @param {string[]}         customMessages Custom messages to print in the terminal.
 *
 * @return {Promise<Object>} GitHub release object.
 */
async function runPackagesRelease( config, customMessages ) {
	log(
		formats.title(
			'\n💃 Time to publish WordPress packages to npm 🕺\n\n'
		),
		"To perform a release you'll have to be a member of the WordPress Team on npm.\n",
		...customMessages
	);

	if ( config.interactive ) {
		await askForConfirmation( 'Ready to go?' );
	}

	const temporaryFolders = [];
	if ( ! config.gitWorkingDirectoryPath ) {
		const gitPath = getRandomTemporaryPath();
		config.gitWorkingDirectoryPath = gitPath;
		fs.mkdirSync( gitPath, { recursive: true } );
		temporaryFolders.push( gitPath );

		await runStep(
			'Cloning the Git repository',
			config.abortMessage,
			async () => {
				log( '>> Cloning the Git repository' );
				await SimpleGit().clone(
					pluginConfig.gitRepositoryURL,
					gitPath,
					[ '--depth=1', '--no-single-branch' ]
				);
				log( `   >> successfully clone into: ${ gitPath }` );
			}
		);
	}

	let pluginReleaseBranch;
	if ( [ 'latest', 'next' ].includes( config.releaseType ) ) {
		pluginReleaseBranch =
			config.releaseType === 'next'
				? 'trunk'
				: await findPluginReleaseBranchName(
						config.gitWorkingDirectoryPath
				  );
		await runNpmReleaseBranchSyncStep( pluginReleaseBranch, config );
	} else {
		await checkoutNpmReleaseBranch( config );
	}

	const commitHashChangelogUpdates = await updatePackages( config );

	const commitHashNpmPublish = await publishPackagesToNpm( config );

	if ( [ 'latest', 'bugfix' ].includes( config.releaseType ) ) {
		const commits = [
			commitHashChangelogUpdates,
			commitHashNpmPublish,
		].filter( Boolean );
		await backportCommitsToBranch( 'trunk', commits, config );

		if ( config.releaseType === 'latest' && pluginReleaseBranch ) {
			await backportCommitsToBranch(
				pluginReleaseBranch,
				commits,
				config
			);
		}
	}

	await runStep(
		'Cleaning the temporary folders',
		'Cleaning failed',
		async () =>
			await Promise.all(
				temporaryFolders
					.filter( ( tempDir ) => fs.existsSync( tempDir ) )
					.map( ( tempDir ) => rimraf( tempDir ) )
			)
	);

	log(
		'\n>> 🎉 WordPress packages are now published!\n\n',
		'Let also people know on WordPress Slack and celebrate together.'
	);
}

/**
 * Gets config object.
 *
 * @param {ReleaseType}              releaseType The selected release type.
 * @param {WPPackagesCommandOptions} options     Command options.
 *
 * @return {WPPackagesConfig} The config object.
 */
function getConfig(
	releaseType,
	{ ci, repositoryPath, semver = 'patch', wpVersion }
) {
	let distTag = 'latest';
	let npmReleaseBranch = 'wp/latest';
	if ( releaseType === 'next' ) {
		distTag = 'next';
		npmReleaseBranch = 'wp/next';
	} else if ( releaseType === 'wp' ) {
		distTag = `wp-${ wpVersion }`;
		npmReleaseBranch = `wp/${ wpVersion }`;
	}

	return {
		abortMessage: 'Aborting!',
		distTag,
		gitWorkingDirectoryPath:
			repositoryPath && join( process.cwd(), repositoryPath ),
		interactive: ! ci,
		minimumVersionBump: semver,
		npmReleaseBranch,
		releaseType,
	};
}

/**
 * Publishes to npm packages synced from the Gutenberg plugin (latest dist-tag, production version).
 *
 * @param {WPPackagesCommandOptions} options Command options.
 */
async function publishNpmGutenbergPlugin( options ) {
	await runPackagesRelease( getConfig( 'latest', options ), [
		'Welcome! This tool helps with npm publishing a new latest version of WordPress packages synced from the Gutenberg plugin.\n',
	] );
}

/**
 * Publishes to npm bugfixes for packages (latest dist-tag, production version).
 *
 * @param {WPPackagesCommandOptions} options Command options.
 */
async function publishNpmBugfixLatest( options ) {
	await runPackagesRelease( getConfig( 'bugfix', options ), [
		'Welcome! This tool helps with npm publishing a new bugfix version of WordPress packages.\n',
		'Make sure that all required changes have been already cherry-picked to the `wp/latest` release branch.\n',
	] );
}

/**
 * Publishes to npm bugfixes targeting WordPress core (wp-X.Y dist-tag, production version).
 *
 * @param {WPPackagesCommandOptions} options Command options.
 */
async function publishNpmBugfixWordPressCore( options ) {
	await runPackagesRelease( getConfig( 'wp', options ), [
		'Welcome! This tool helps with npm publishing a new bugfix version of WordPress packages targeting WordPress core.\n',
		'Make sure that all required changes have been already cherry-picked to the `wp/X.Y` release branch.\n',
	] );
}

/**
 * Publishes to npm development version of packages (next dist-tag, prerelease version).
 *
 * @param {WPPackagesCommandOptions} options Command options.
 */
async function publishNpmNext( options ) {
	await runPackagesRelease( getConfig( 'next', options ), [
		'Welcome! This tool helps with npm publishing a development version of WordPress packages.\n',
	] );
}

module.exports = {
	publishNpmGutenbergPlugin,
	publishNpmBugfixLatest,
	publishNpmBugfixWordPressCore,
	publishNpmNext,
};
