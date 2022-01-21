/**
 * External dependencies
 */
const { command } = require( 'execa' );
const path = require( 'path' );
const glob = require( 'fast-glob' );
const fs = require( 'fs' );
const semver = require( 'semver' );
const readline = require( 'readline' );
const { prompt } = require( 'inquirer' );

/**
 * Internal dependencies
 */
const { log, formats } = require( '../lib/logger' );
const { askForConfirmation, runStep, readJSONFile } = require( '../lib/utils' );
const {
	calculateVersionBumpFromChangelog,
	findReleaseBranchName,
	runGitRepositoryCloneStep,
	runCleanLocalFoldersStep,
} = require( './common' );
const git = require( '../lib/git' );

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
 * Checks out the WordPress release branch and syncs it with the changes from
 * the last plugin release.
 *
 * @param {string}      gitWorkingDirectoryPath Git working directory path.
 * @param {ReleaseType} releaseType             Release type selected from CLI.
 * @param {string}      abortMessage            Abort Message.
 *
 * @return {Promise<Object>} WordPress release branch.
 */
async function runWordPressReleaseBranchSyncStep(
	gitWorkingDirectoryPath,
	releaseType,
	abortMessage
) {
	const wordpressReleaseBranch =
		releaseType === 'next' ? 'wp/next' : 'wp/trunk';
	await runStep(
		'Getting into the WordPress release branch',
		abortMessage,
		async () => {
			const packageJsonPath = gitWorkingDirectoryPath + '/package.json';
			const pluginReleaseBranch = findReleaseBranchName(
				packageJsonPath
			);

			// Creating the release branch
			await git.checkoutRemoteBranch(
				gitWorkingDirectoryPath,
				wordpressReleaseBranch
			);
			await git.fetch( gitWorkingDirectoryPath, [ '--depth=100' ] );
			log(
				'>> The local release branch ' +
					formats.success( wordpressReleaseBranch ) +
					' has been successfully checked out.'
			);

			if ( [ 'latest', 'next' ].includes( releaseType ) ) {
				await askForConfirmation(
					`The branch is ready for sync with the latest plugin release changes applied to "${ pluginReleaseBranch }". Proceed?`,
					true,
					abortMessage
				);

				await git.replaceContentFromRemoteBranch(
					gitWorkingDirectoryPath,
					pluginReleaseBranch
				);

				await git.commit(
					gitWorkingDirectoryPath,
					`Merge changes published in the Gutenberg plugin "${ pluginReleaseBranch }" branch`
				);

				log(
					'>> The local WordPress release branch ' +
						formats.success( wordpressReleaseBranch ) +
						' has been successfully synced.'
				);
			}
		}
	);

	return {
		releaseBranch: wordpressReleaseBranch,
	};
}

/**
 * Update CHANGELOG files with the new version number for those packages that
 * contain new entries.
 *
 * @param {string}      gitWorkingDirectoryPath Git working directory path.
 * @param {SemVer}      minimumVersionBump      Minimum version bump for the packages.
 * @param {ReleaseType} releaseType             Release type selected from CLI.
 * @param {string}      abortMessage            Abort Message.
 */
async function updatePackages(
	gitWorkingDirectoryPath,
	minimumVersionBump,
	releaseType,
	abortMessage
) {
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
				versionBump !== null
					? semver.inc( version, versionBump )
					: null;

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
				// Update changelog
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

				// Update package.json
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

	await askForConfirmation(
		`All corresponding files were updated. Commit the changes?`,
		true,
		abortMessage
	);
	git.commit( gitWorkingDirectoryPath, 'Update changelog files', [ './*' ] );
	log( '>> Changelog files changes have been committed successfully.' );
}

/**
 * Push the local Git Changes the remote repository.
 *
 * @param {string} gitWorkingDirectoryPath Git working directory path.
 * @param {string} releaseBranch           Release branch name.
 * @param {string} abortMessage            Abort message.
 */
async function runPushGitChangesStep(
	gitWorkingDirectoryPath,
	releaseBranch,
	abortMessage
) {
	await runStep( 'Pushing the release branch', abortMessage, async () => {
		await askForConfirmation(
			'The release branch is going to be pushed to the remote repository. Continue?',
			true,
			abortMessage
		);
		await git.pushBranchToOrigin( gitWorkingDirectoryPath, releaseBranch );
	} );
}

/**
 * Publishes all changed packages to npm.
 *
 * @param {string}      gitWorkingDirectoryPath Git working directory path.
 * @param {SemVer}      minimumVersionBump      Minimum version bump for the packages.
 * @param {ReleaseType} releaseType             Release type selected from CLI.
 */
async function publishPackagesToNpm(
	gitWorkingDirectoryPath,
	minimumVersionBump,
	releaseType
) {
	log( '>> Installing npm packages.' );
	await command( 'pnpm install', {
		cwd: gitWorkingDirectoryPath,
	} );

	if ( releaseType === 'next' ) {
		log(
			'>> Bumping version of public packages changed since the last release.'
		);
		const { stdout: sha } = await command( 'git rev-parse --short HEAD' );
		await command(
			`npx lerna version pre${ minimumVersionBump } --preid next.${ sha } --no-private`,
			{
				cwd: gitWorkingDirectoryPath,
				stdio: 'inherit',
			}
		);

		log( '>> Publishing modified packages to npm.' );
		await command( 'npx lerna publish from-package --dist-tag next', {
			cwd: gitWorkingDirectoryPath,
			stdio: 'inherit',
		} );
	} else if ( releaseType === 'bugfix' ) {
		log( '>> Publishing modified packages to npm.' );
		await command( `pnpm publish:latest`, {
			cwd: gitWorkingDirectoryPath,
			stdio: 'inherit',
		} );
	} else {
		log(
			'>> Bumping version of public packages changed since the last release.'
		);
		await command(
			`npx lerna version ${ minimumVersionBump } --no-private`,
			{
				cwd: gitWorkingDirectoryPath,
				stdio: 'inherit',
			}
		);

		log( '>> Publishing modified packages to npm.' );
		await command( `npx lerna publish from-package`, {
			cwd: gitWorkingDirectoryPath,
			stdio: 'inherit',
		} );
	}
}

/**
 * Prepare everything to publish WordPress packages to npm.
 *
 * @param {ReleaseType} releaseType           Release type selected from CLI.
 * @param {SemVer}      [minimumVersionBump]  Minimum version bump for the packages. Default: `true`.
 * @param {string}      [confirmationMessage] Confirmation message to show at first.
 *
 * @return {Promise<Object>} GitHub release object.
 */
async function prepareForPackageRelease(
	releaseType,
	minimumVersionBump = 'patch',
	confirmationMessage = 'Ready to go?'
) {
	await askForConfirmation( confirmationMessage );

	// Cloning the Git repository.
	const abortMessage = 'Aborting!';
	const gitWorkingDirectoryPath = await runGitRepositoryCloneStep(
		abortMessage
	);
	const temporaryFolders = [];
	temporaryFolders.push( gitWorkingDirectoryPath );

	// Checking out the WordPress release branch and doing sync with the last plugin release.
	const { releaseBranch } = await runWordPressReleaseBranchSyncStep(
		gitWorkingDirectoryPath,
		releaseType,
		abortMessage
	);

	await updatePackages(
		gitWorkingDirectoryPath,
		minimumVersionBump,
		releaseType,
		abortMessage
	);

	await runPushGitChangesStep(
		gitWorkingDirectoryPath,
		releaseBranch,
		`Aborting! Make sure to push changes applied to WordPress release branch "${ releaseBranch }" manually.`
	);

	await publishPackagesToNpm(
		gitWorkingDirectoryPath,
		minimumVersionBump,
		releaseType
	);

	await runCleanLocalFoldersStep( temporaryFolders, 'Cleaning failed.' );
}

/**
 * Publishes a new latest version of WordPress packages.
 */
async function publishNpmLatestDistTag() {
	log(
		formats.title(
			'\n💃 Time to publish WordPress packages to npm 🕺\n\n'
		),
		'Welcome! This tool is going to help you with publishing a new latest version of WordPress packages.\n',
		"To perform a release you'll have to be a member of the WordPress Team on npm.\n"
	);

	const { minimumVersionBump } = await prompt( [
		{
			type: 'list',
			name: 'minimumVersionBump',
			message: 'Select the minimum version bump for packages:',
			default: 'patch',
			choices: [ 'patch', 'minor', 'major' ],
		},
	] );

	await prepareForPackageRelease( 'latest', minimumVersionBump );

	log(
		'\n>> 🎉 WordPress packages are now published!\n\n',
		'Please remember to run `git cherry-pick` in the `trunk` branch for the newly created commits during the release with labels:\n',
		' - Update changelog files (if exists)\n',
		' - chore(release): publish\n\n',
		'Finally, let also people know on WordPress Slack and celebrate together.'
	);
}

/**
 * Publishes a new latest version of WordPress packages.
 */
async function publishNpmBugfixLatestDistTag() {
	log(
		formats.title(
			'\n💃 Time to publish WordPress packages to npm 🕺\n\n'
		),
		'Welcome! This tool is going to help you with publishing a new bugfix version of WordPress packages with the latest dist tag.\n',
		"To perform a release you'll have to be a member of the WordPress Team on npm.\n"
	);

	await prepareForPackageRelease(
		'bugfix',
		'patch',
		'Before we proceed, can you confirm that all required changes have beed already cherry-picked to the release branch?'
	);

	log(
		'\n>> 🎉 WordPress packages are now published!\n\n',
		'Please remember to run `git cherry-pick` in the `trunk` branch for the newly created commits during the release with labels:\n',
		' - Update changelog files (if exists)\n',
		' - chore(release): publish\n\n',
		'Finally, let also people know on WordPress Slack and celebrate together.'
	);
}

/**
 * Publishes a new next version of WordPress packages.
 */
async function publishNpmNextDistTag() {
	log(
		formats.title(
			'\n💃 Time to publish WordPress packages to npm 🕺\n\n'
		),
		'Welcome! This tool is going to help you with publishing a new next version of WordPress packages.\n',
		"To perform a release you'll have to be a member of the WordPress Team on npm.\n"
	);

	await prepareForPackageRelease( 'next' );

	log(
		'\n>> 🎉 WordPress packages are now published!\n',
		'Let also people know on WordPress Slack.\n'
	);
}

module.exports = {
	publishNpmLatestDistTag,
	publishNpmBugfixLatestDistTag,
	publishNpmNextDistTag,
};
