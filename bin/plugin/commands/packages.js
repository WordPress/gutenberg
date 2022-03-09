/**
 * External dependencies
 */
const { command } = require( 'execa' );
const path = require( 'path' );
const glob = require( 'fast-glob' );
const fs = require( 'fs' );
const { inc: semverInc } = require( 'semver' );
const readline = require( 'readline' );

/**
 * Internal dependencies
 */
const { log, formats } = require( '../lib/logger' );
const { askForConfirmation, runStep, readJSONFile } = require( '../lib/utils' );
const {
	calculateVersionBumpFromChangelog,
	findPluginReleaseBranchName,
	runGitRepositoryCloneStep,
	runCleanLocalFoldersStep,
} = require( './common' );
const git = require( '../lib/git' );
const { join } = require( 'path' );

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
 */

/**
 * @typedef WPPackagesConfig
 *
 * @property {string}      abortMessage            Abort Message.
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
	// Creating the release branch.
	await git.checkoutRemoteBranch( gitWorkingDirectoryPath, npmReleaseBranch );
	await git.fetch( gitWorkingDirectoryPath, [ '--depth=100' ] );
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

		await git.replaceContentFromRemoteBranch(
			gitWorkingDirectoryPath,
			pluginReleaseBranch
		);

		const commitHash = await git.commit(
			gitWorkingDirectoryPath,
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
	const changelogFiles = await glob(
		path.resolve( gitWorkingDirectoryPath, 'packages/*/CHANGELOG.md' )
	);
	const changelogFilesPublicPackages = changelogFiles.filter(
		( changelogPath ) => {
			const pkg = require( path.join(
				path.dirname( changelogPath ),
				'package.json'
			) );
			return pkg.private !== true;
		}
	);

	const productionPackageNames = Object.keys(
		require( '../../../package.json' ).dependencies
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
			// Enforce version bump for production packages when
			// the stable minor or major version bump requested.
			if (
				! versionBump &&
				releaseType !== 'next' &&
				minimumVersionBump !== 'patch' &&
				productionPackageNames.includes( packageName )
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
				const content = await fs.promises.readFile(
					changelogPath,
					'utf8'
				);
				await fs.promises.writeFile(
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

	const commitHash = await git.commit(
		gitWorkingDirectoryPath,
		'Update changelog files',
		[ './*' ]
	);
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
		await git.pushBranchToOrigin(
			gitWorkingDirectoryPath,
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

	const beforeCommitHash = await git.getLastCommitHash(
		gitWorkingDirectoryPath
	);

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
			`npx lerna publish from-package --dist-tag next ${ yesFlag } ${ noVerifyAccessFlag }`,
			{
				cwd: gitWorkingDirectoryPath,
				stdio: 'inherit',
			}
		);
	} else if ( releaseType === 'bugfix' ) {
		log( '>> Publishing modified packages to npm.' );
		await command(
			`npx lerna publish ${ minimumVersionBump } --no-private ${ yesFlag } ${ noVerifyAccessFlag }`,
			{
				cwd: gitWorkingDirectoryPath,
				stdio: 'inherit',
			}
		);
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
		await command(
			`npx lerna publish from-package ${ yesFlag } ${ noVerifyAccessFlag }`,
			{
				cwd: gitWorkingDirectoryPath,
				stdio: 'inherit',
			}
		);
	}

	const afterCommitHash = await git.getLastCommitHash(
		gitWorkingDirectoryPath
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

	await git.resetLocalBranchAgainstOrigin(
		gitWorkingDirectoryPath,
		branchName
	);
	for ( const commitHash of commits ) {
		await git.cherrypickCommitIntoBranch(
			gitWorkingDirectoryPath,
			branchName,
			commitHash
		);
	}
	await git.pushBranchToOrigin( gitWorkingDirectoryPath, branchName );

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
		// Cloning the Git repository.
		config.gitWorkingDirectoryPath = await runGitRepositoryCloneStep(
			config.abortMessage
		);
		temporaryFolders.push( config.gitWorkingDirectoryPath );
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

	await runCleanLocalFoldersStep( temporaryFolders, 'Cleaning failed.' );

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
function getConfig( releaseType, { ci, repositoryPath, semver } ) {
	return {
		abortMessage: 'Aborting!',
		gitWorkingDirectoryPath:
			repositoryPath && join( process.cwd(), repositoryPath ),
		interactive: ! ci,
		minimumVersionBump: semver,
		npmReleaseBranch: releaseType === 'next' ? 'wp/next' : 'wp/trunk',
		releaseType,
	};
}

/**
 * Publishes a new latest version of WordPress packages.
 *
 * @param {WPPackagesCommandOptions} options Command options.
 */
async function publishNpmLatestDistTag( options ) {
	await runPackagesRelease( getConfig( 'latest', options ), [
		'Welcome! This tool helps with publishing a new latest version of WordPress packages.\n',
	] );
}

/**
 * Publishes a new latest version of WordPress packages.
 *
 * @param {WPPackagesCommandOptions} options Command options.
 */
async function publishNpmBugfixLatestDistTag( options ) {
	await runPackagesRelease( getConfig( 'bugfix', options ), [
		'Welcome! This tool is going to help you with publishing a new bugfix version of WordPress packages with the latest dist tag.\n',
		'Make sure that all required changes have been already cherry-picked to the release branch.\n',
	] );
}

/**
 * Publishes a new next version of WordPress packages.
 *
 * @param {WPPackagesCommandOptions} options Command options.
 */
async function publishNpmNextDistTag( options ) {
	await runPackagesRelease( getConfig( 'next', options ), [
		'Welcome! This tool helps with publishing a new next version of WordPress packages.\n',
	] );
}

module.exports = {
	publishNpmLatestDistTag,
	publishNpmBugfixLatestDistTag,
	publishNpmNextDistTag,
};
