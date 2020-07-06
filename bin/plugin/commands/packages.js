/**
 * External dependencies
 */
const path = require( 'path' );
const glob = require( 'fast-glob' );
const fs = require( 'fs' );
const semver = require( 'semver' );
const readline = require( 'readline' );
const childProcess = require( 'child_process' );

/**
 * Internal dependencies
 */
const { log, formats } = require( '../lib/logger' );
const {
	askForConfirmation,
	runStep,
	readJSONFile,
	runShellScript,
} = require( '../lib/utils' );
const {
	runGitRepositoryCloneStep,
	runCleanLocalFoldersStep,
	findReleaseBranchName,
} = require( './common' );
const git = require( '../lib/git' );

/**
 * Checks out the WordPress release branch and syncs it with the changes from
 * the last plugin release.
 *
 * @param {string} gitWorkingDirectoryPath Git working directory path.
 * @param {string} abortMessage            Abort Message.
 *
 * @return {Promise<Object>} WordPress release branch.
 */
async function runWordPressReleaseBranchSyncStep(
	gitWorkingDirectoryPath,
	abortMessage
) {
	const wordpressReleaseBranch = 'wp/trunk';
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
			log(
				'>> The local release branch ' +
					formats.success( wordpressReleaseBranch ) +
					' has been successfully checked out.'
			);

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
	);

	return {
		releaseBranch: wordpressReleaseBranch,
	};
}

/**
 * Update CHANGELOG files with the new version number for those packages that
 * contain new entries.
 *
 * @param {string} gitWorkingDirectoryPath Git working directory path.
 * @param {string} minimumVersionBump      Minimum version bump for the packages.
 * @param {string} abortMessage            Abort Message.
 */
async function updatePackageChangelogs(
	gitWorkingDirectoryPath,
	minimumVersionBump,
	abortMessage
) {
	const changelogFiles = await glob(
		path.resolve( gitWorkingDirectoryPath, 'packages/*/CHANGELOG.md' )
	);
	const processedPackages = await Promise.all(
		changelogFiles.map( async ( changelogPath ) => {
			const fileStream = fs.createReadStream( changelogPath );

			const lines = readline.createInterface( {
				input: fileStream,
			} );

			let changesDetected = false;
			let versionBump = null;
			for await ( const line of lines ) {
				const lineNormalized = line.toLowerCase();
				// Detect unpublished changes first.
				if ( lineNormalized.startsWith( '## unreleased' ) ) {
					changesDetected = true;
					continue;
				}

				// Skip all lines until unpublished changes found.
				if ( ! changesDetected ) {
					continue;
				}

				// A previous published version detected. Stop processing.
				if ( lineNormalized.startsWith( '## ' ) ) {
					break;
				}

				// A major version bump required. Stop processing.
				if ( lineNormalized.startsWith( '### breaking change' ) ) {
					versionBump = 'major';
					break;
				}

				// A minor version bump required. Proceed to the next line.
				if (
					lineNormalized.startsWith( '### deprecation' ) ||
					lineNormalized.startsWith( '### enhancement' ) ||
					lineNormalized.startsWith( '### new feature' )
				) {
					versionBump = 'minor';
					continue;
				}

				// A version bump required. Found new changelog section.
				if (
					versionBump !== 'minor' &&
					( lineNormalized.startsWith( '### ' ) ||
						lineNormalized.startsWith( '- initial release' ) )
				) {
					versionBump = minimumVersionBump;
				}
			}
			const packageName = `@wordpress/${
				changelogPath.split( '/' ).reverse()[ 1 ]
			}`;
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
						`## Unreleased\n\n## ${ nextVersion } (${ publishDate })`
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
					`   - ${ packageName }: ${ version } -> ${ nextVersion }`
				);
			}
		)
	);

	await askForConfirmation(
		`All corresponding files were updated. Commit the changes?`,
		true,
		abortMessage
	);
	const commitHash = await git.commit(
		gitWorkingDirectoryPath,
		'Update changelog files',
		[ './*' ]
	);
	log( '>> Changelog files changes have been committed successfully.' );

	return commitHash;
}

/**
 * Publishes the new packages to npm
 *
 * @param {string} gitWorkingDirectoryPath Git working directory path.
 * @param {string} minimumVersionBump      Minimum version bump for the packages.
 * @param {string} abortMessage            Abort Message.
 */
async function publishPackages(
	gitWorkingDirectoryPath,
	minimumVersionBump,
	abortMessage
) {
	await runStep( 'Publishing the npm packages', abortMessage, async () => {
		await askForConfirmation(
			'The npm packages are about to be published. Make sure to use to use the bump the ' +
				formats.title( minimumVersionBump ) +
				' version at least for each package unless the changelog indicates otherwise. Continue?',
			true,
			abortMessage
		);

		childProcess.execSync( 'npm install && npm run publish:prod', {
			gitWorkingDirectoryPath,
			env: {
				PATH: process.env.PATH,
				HOME: process.env.HOME,
			},
			stdio: 'inherit',
		} );
	} );
}

/**
 * Push the local Git Changes and Tags to the remote repository.
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
	await runStep(
		'Pushing the release branch and tags',
		abortMessage,
		async () => {
			await askForConfirmation(
				'The release branch and the tag are going to be pushed to the remote repository. Continue?',
				true,
				abortMessage
			);
			await git.pushBranchToOrigin(
				gitWorkingDirectoryPath,
				releaseBranch
			);
			await git.pushTagsToOrigin();
		}
	);
}

/**
 * Prepare everything to publish WordPress packages to npm.
 *
 * @param {string} minimumVersionBump Minimum version bump for the packages.
 *
 * @return {Promise<Object>} Github release object.
 */
async function prepareForPackageRelease( minimumVersionBump ) {
	// This is a variable that contains the abort message shown when the script is aborted.
	let abortMessage = 'Aborting!';
	const temporaryFolders = [];
	await askForConfirmation( 'Ready to go? ' );

	// Cloning the Git repository.
	const gitWorkingDirectoryPath = await runGitRepositoryCloneStep(
		abortMessage
	);
	temporaryFolders.push( gitWorkingDirectoryPath );

	// Checking out the WordPress release branch and doing sync with the last plugin release.
	const { releaseBranch } = await runWordPressReleaseBranchSyncStep(
		gitWorkingDirectoryPath,
		abortMessage
	);

	const commitHash = await updatePackageChangelogs(
		gitWorkingDirectoryPath,
		minimumVersionBump,
		abortMessage
	);

	await runPushGitChangesStep(
		gitWorkingDirectoryPath,
		releaseBranch,
		abortMessage
	);

	abortMessage = `Aborting! The release branch is synced. Make sure to publish the npm packages manually and backport the changelog commit (${ formats.title(
		commitHash
	) }) to master.`;

	await publishPackages(
		gitWorkingDirectoryPath,
		minimumVersionBump,
		abortMessage
	);

	abortMessage = `Aborting! The packages have published though. Make sure to backport the changelog commit (${ formats.title(
		commitHash
	) }) to master.`;

	await runPushGitChangesStep(
		gitWorkingDirectoryPath,
		releaseBranch,
		abortMessage
	);

	console.log(
		`Packages published successfully. Make sure to backport the changelog commit (${ formats.title(
			commitHash
		) }) to master.`
	);

	abortMessage = 'Aborting! The release is finished though.';
	await runCleanLocalFoldersStep( temporaryFolders, abortMessage );
}

async function publishLatestPackages() {
	log(
		formats.title(
			'\n💃 Time to publish WordPress packages to npm 🕺\n\n'
		),
		'Welcome! This tool is going to help you release a new stable version of WordPress packages.\n',
		"To perform a release you'll have to be a member of the WordPress Team on npm.\n"
	);

	await prepareForPackageRelease( 'patch' );

	log(
		'\n>> 🎉 WordPress packages are now published!\n',
		"Don't forget to backport the changelogs to master.\n",
		'Let also people know on WordPress Slack when everything is finished.\n'
	);
}

module.exports = { publishLatestPackages };
