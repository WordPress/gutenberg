/**
 * External dependencies
 */
const inquirer = require( 'inquirer' );
const fs = require( 'fs' );
const semver = require( 'semver' );
const Octokit = require( '@octokit/rest' );
const { sprintf } = require( 'sprintf-js' );

/**
 * Internal dependencies
 */
const { log, formats } = require( '../lib/logger' );
const { askForConfirmation, runStep, readJSONFile } = require( '../lib/utils' );
const git = require( '../lib/git' );
const { getNextMajorVersion } = require( '../lib/version' );
const {
	getIssuesByMilestone,
	getMilestoneByTitle,
} = require( '../lib/milestone' );
const config = require( '../config' );
const {
	runGitRepositoryCloneStep,
	runCleanLocalFoldersStep,
	findReleaseBranchName,
} = require( './common' );

/**
 * Creates a new release branch based on the last package.json version
 * and chooses the next version number.
 *
 * @param {string} gitWorkingDirectoryPath Git Working Directory Path.
 * @param {string} abortMessage            Abort Message.
 * @param {string} version the new version.
 * @param {string} releaseBranch The release branch to push to.
 */
async function runReleaseBranchCreationStep(
	gitWorkingDirectoryPath,
	abortMessage,
	version,
	releaseBranch
) {
	await runStep( 'Creating the release branch', abortMessage, async () => {
		await askForConfirmation(
			'The Plugin version to be used is ' +
				formats.success( version ) +
				'. Proceed with the creation of the release branch?',
			true,
			abortMessage
		);

		// Creates the release branch
		await git.createLocalBranch( gitWorkingDirectoryPath, releaseBranch );

		log(
			'>> The local release branch ' +
				formats.success( releaseBranch ) +
				' has been successfully created.'
		);
	} );
}

/**
 * Checkouts out the release branch.
 *
 * @param {string} gitWorkingDirectoryPath Git Working Directory Path.
 * @param {string} abortMessage Abort Message.
 * @param {string} version The new version.
 * @param {string} releaseBranch The release branch to checkout.
 */
async function runReleaseBranchCheckoutStep(
	gitWorkingDirectoryPath,
	abortMessage,
	version,
	releaseBranch
) {
	await runStep(
		'Getting into the release branch',
		abortMessage,
		async () => {
			await git.checkoutRemoteBranch(
				gitWorkingDirectoryPath,
				releaseBranch
			);

			log(
				'>> The local release branch ' +
					formats.success( releaseBranch ) +
					' has been successfully checked out.'
			);

			await askForConfirmation(
				'The Version to release is ' +
					formats.success( version ) +
					'. Proceed?',
				true,
				abortMessage
			);
		}
	);
}

/**
 * Bump the version in the different files (package.json, package-lock.json...)
 * and commit the changes.
 *
 * @param {string} gitWorkingDirectoryPath Git Working Directory Path.
 * @param {string} version                 Version to use.
 * @param {string} changelog               Changelog to use.
 * @param {string} abortMessage            Abort message.
 *
 * @return {Promise<string>} hash of the version bump commit.
 */
async function runBumpPluginVersionUpdateChangelogAndCommitStep(
	gitWorkingDirectoryPath,
	version,
	changelog,
	abortMessage
) {
	let commitHash;
	await runStep( 'Updating the plugin version', abortMessage, async () => {
		const packageJsonPath = gitWorkingDirectoryPath + '/package.json';
		const packageLockPath = gitWorkingDirectoryPath + '/package-lock.json';
		const pluginFilePath =
			gitWorkingDirectoryPath + '/' + config.pluginEntryPoint;
		const packageJson = readJSONFile( packageJsonPath );
		const packageLock = readJSONFile( packageLockPath );
		const newPackageJson = {
			...packageJson,
			version,
		};
		fs.writeFileSync(
			packageJsonPath,
			JSON.stringify( newPackageJson, null, '\t' ) + '\n'
		);
		const newPackageLock = {
			...packageLock,
			version,
		};
		fs.writeFileSync(
			packageLockPath,
			JSON.stringify( newPackageLock, null, '\t' ) + '\n'
		);
		const content = fs.readFileSync( pluginFilePath, 'utf8' );
		fs.writeFileSync(
			pluginFilePath,
			content.replace(
				' * Version: ' + packageJson.version,
				' * Version: ' + version
			)
		);

		// Update the content of the readme.txt file
		const readmePath = gitWorkingDirectoryPath + '/readme.txt';
		const readmeFileContent = fs.readFileSync( readmePath, 'utf8' );
		const newReadmeContent =
			readmeFileContent.substr(
				0,
				readmeFileContent.indexOf( '== Changelog ==' )
			) +
			'== Changelog ==\n\n' +
			`To read the changelog for ${ config.name } ${ version }, please navigate to the <a href="${ config.wpRepositoryReleasesURL }v${ version }">release page</a>.` +
			'\n';
		fs.writeFileSync( readmePath, newReadmeContent );

		// Update the content of the changelog.txt file
		const stableVersion = version.match( /[0-9]+\.[0-9]+\.[0-9]+/ )[ 0 ];
		const changelogPath = gitWorkingDirectoryPath + '/changelog.txt';
		const changelogFileContent = fs.readFileSync( changelogPath, 'utf8' );
		const versionHeader = '= ' + version + ' =\n\n';
		const regexToSearch = /=\s([0-9]+\.[0-9]+\.[0-9]+)(-rc\.[0-9]+)?\s=\n\n/g;
		let lastDifferentVersionMatch = regexToSearch.exec(
			changelogFileContent
		);
		if ( lastDifferentVersionMatch[ 1 ] === stableVersion ) {
			lastDifferentVersionMatch = regexToSearch.exec(
				changelogFileContent
			);
		}
		const newChangelogContent =
			'== Changelog ==\n\n' +
			versionHeader +
			changelog +
			'\n\n' +
			changelogFileContent.substr( lastDifferentVersionMatch.index );
		fs.writeFileSync( changelogPath, newChangelogContent );

		log(
			'>> The plugin version and changelog have been updated successfully.'
		);

		// Commit the version bump
		await askForConfirmation(
			'Please check the diff. Proceed with the version bump commit?',
			true,
			abortMessage
		);
		commitHash = await git.commit(
			gitWorkingDirectoryPath,
			'Bump plugin version to ' + version,
			[
				packageJsonPath,
				packageLockPath,
				pluginFilePath,
				readmePath,
				changelogPath,
			]
		);
		log(
			'>> The plugin version bump and changelog update have been committed successfully.'
		);
	} );

	return commitHash;
}

/**
 * Create a local Git Tag.
 *
 * @param {string} gitWorkingDirectoryPath Git Working Directory Path.
 * @param {string} version                 Version to use.
 * @param {string} abortMessage            Abort message.
 */
async function runCreateGitTagStep(
	gitWorkingDirectoryPath,
	version,
	abortMessage
) {
	await runStep( 'Creating the git tag', abortMessage, async () => {
		await askForConfirmation(
			'Proceed with the creation of the git tag?',
			true,
			abortMessage
		);

		await git.createLocalTag( gitWorkingDirectoryPath, 'v' + version );

		log(
			'>> The ' +
				formats.success( 'v' + version ) +
				' tag has been created successfully.'
		);
	} );
}

/**
 * Push the local Git Changes and Tags to the remote repository.
 *
 * @param {string} gitWorkingDirectoryPath Git Working Directory Path.
 * @param {string} releaseBranch           Release branch name.
 * @param {string} abortMessage            Abort message.
 */
async function runPushGitChangesStep(
	gitWorkingDirectoryPath,
	releaseBranch,
	abortMessage
) {
	await runStep(
		'Pushing the release branch and the tag',
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

			await git.pushTagsToOrigin( gitWorkingDirectoryPath );
		}
	);
}

/**
 * Cherry-picks the version bump commit into trunk.
 *
 * @param {string} gitWorkingDirectoryPath Git Working Directory Path.
 * @param {string} commitHash   Commit to cherry-pick.
 * @param {string} abortMessage Abort message.
 */
async function runCherrypickBumpCommitIntoTrunkStep(
	gitWorkingDirectoryPath,
	commitHash,
	abortMessage
) {
	await runStep(
		'Cherry-picking the bump commit into trunk',
		abortMessage,
		async () => {
			await askForConfirmation(
				'The plugin is now released. Proceed with the version bump in the trunk branch?',
				true,
				abortMessage
			);
			await git.discardLocalChanges( gitWorkingDirectoryPath );
			await git.resetLocalBranchAgainstOrigin(
				gitWorkingDirectoryPath,
				'trunk'
			);
			await git.cherrypickCommitIntoBranch(
				gitWorkingDirectoryPath,
				commitHash,
				'trunk'
			);
			await git.pushBranchToOrigin( gitWorkingDirectoryPath, 'trunk' );
		}
	);
}

/**
 * Checks whether the milestone associated with the release has open issues or
 * pull requests. Returns a promise resolving to true if there are no open issue
 * or pull requests, or false otherwise.
 *
 * @param {string} version Release version.
 *
 * @return {Promise<boolean>} Promise resolving to boolean indicating whether
 *                            the milestone is clear of open issues.
 */
async function isMilestoneClear( version ) {
	const { githubRepositoryOwner: owner, githubRepositoryName: name } = config;
	const octokit = new Octokit();
	const milestone = await getMilestoneByTitle(
		octokit,
		owner,
		name,
		// Disable reason: valid-sprintf applies to `@wordpress/i18n` where
		// strings are expected to need to be extracted, and thus variables are
		// not allowed. This string will not need to be extracted.
		// eslint-disable-next-line @wordpress/valid-sprintf
		sprintf( config.versionMilestoneFormat, {
			...config,
			...semver.parse( version ),
		} )
	);

	if ( ! milestone ) {
		// If milestone can't be found, it's not especially actionable to warn
		// that the milestone isn't clear. `true` is the sensible fallback.
		return true;
	}

	const issues = await getIssuesByMilestone(
		new Octokit(),
		owner,
		name,
		milestone.number,
		'open'
	);

	return issues.length === 0;
}

/**
 * Release a new version.
 *
 * @param {boolean} isRC Whether it's an RC release or not.
 *
 * @return {string} The new version.
 */
async function releasePlugin( isRC = true ) {
	// This is a variable that contains the abort message shown when the script is aborted.
	let abortMessage = 'Aborting!';
	let version, releaseBranch;

	const temporaryFolders = [];

	await askForConfirmation( 'Ready to go? ' );

	const { changelog } = await inquirer.prompt( [
		{
			type: 'editor',
			name: 'changelog',
			message: 'Please provide the CHANGELOG of the release (markdown)',
		},
	] );

	// Cloning the Git repository
	const gitWorkingDirectory = await runGitRepositoryCloneStep( abortMessage );
	temporaryFolders.push( gitWorkingDirectory );

	const packageJsonPath = gitWorkingDirectory + '/package.json';
	const packageJson = readJSONFile( packageJsonPath );
	const packageVersion = packageJson.version;
	const parsedPackagedVersion = semver.parse( packageJson.version );
	const isPackageVersionRC = parsedPackagedVersion.prerelease.length > 0;

	// Are we going to release an RC?
	if ( isRC ) {
		// We are releasing an RC.
		// If packageVersion is stable, then generate new branch and RC1.
		// If packageVersion is RC, then checkout branch and inc RC.
		if ( ! isPackageVersionRC ) {
			version = getNextMajorVersion( packageVersion ) + '-rc.1';
			const parsedVersion = semver.parse( version );

			releaseBranch =
				'release/' + parsedVersion.major + '.' + parsedVersion.minor;

			await runReleaseBranchCreationStep(
				gitWorkingDirectory,
				abortMessage,
				version,
				releaseBranch
			);
		} else {
			version = semver.inc( packageVersion, 'prerelease', 'rc' );
			releaseBranch = findReleaseBranchName( packageJsonPath );

			await runReleaseBranchCheckoutStep(
				gitWorkingDirectory,
				abortMessage,
				version,
				releaseBranch
			);
		}
	} else {
		// We are releasing a stable version.
		// If packageVersion is stable, then checkout the branch and inc patch.
		// If packageVersion is RC, then checkout the branch and inc patch, effectively removing the RC.
		version = semver.inc( packageVersion, 'patch' );
		releaseBranch = findReleaseBranchName( packageJsonPath );

		await runReleaseBranchCheckoutStep(
			gitWorkingDirectory,
			abortMessage,
			version,
			findReleaseBranchName( packageJsonPath )
		);
	}

	if ( ! ( await isMilestoneClear( version ) ) ) {
		await askForConfirmation(
			'There are still open issues in the milestone. Are you sure you want to proceed?',
			false,
			abortMessage
		);
	}

	// Bumping the version and commit.
	const commitHash = await runBumpPluginVersionUpdateChangelogAndCommitStep(
		gitWorkingDirectory,
		version,
		changelog,
		abortMessage
	);

	// Creating the git tag
	await runCreateGitTagStep( gitWorkingDirectory, version, abortMessage );

	// Push the local changes
	await runPushGitChangesStep(
		gitWorkingDirectory,
		releaseBranch,
		abortMessage
	);

	abortMessage =
		'Aborting! Make sure to manually cherry-pick the ' +
		formats.success( commitHash ) +
		' commit to the trunk branch.';

	// Cherry-picking the bump commit into trunk
	await runCherrypickBumpCommitIntoTrunkStep(
		gitWorkingDirectory,
		commitHash,
		abortMessage
	);

	abortMessage = 'Aborting! The release is finished though.';
	await runCleanLocalFoldersStep( temporaryFolders, abortMessage );

	return version;
}

async function releaseRC() {
	log(
		formats.title( '\n💃 Time to release ' + config.name + ' 🕺\n\n' ),
		'Welcome! This tool is going to help you release a new RC version of the Plugin.\n',
		'It goes through different steps: creating the release branch, bumping the plugin version, tagging the release, and pushing the tag to GitHub.\n',
		'Once the tag is pushed to GitHub, GitHub will build the plugin ZIP, attach it to a release, and publish it.\n',
		"To perform a release you'll have to be a member of the " +
			config.team +
			' Team.\n'
	);

	const version = await releasePlugin( true );

	log(
		'\n>> 🎉 The ' +
			config.name +
			' version ' +
			formats.success( version ) +
			' has been successfully tagged.\n',
		"In a few minutes, you'll be able to find the GitHub release here: " +
			formats.success(
				`${ config.wpRepositoryReleasesURL }v${ version }`
			) +
			'\n',
		'Thanks for performing the release!\n'
	);
}

async function releaseStable() {
	log(
		formats.title( '\n💃 Time to release ' + config.name + ' 🕺\n\n' ),
		'Welcome! This tool is going to help you release a new stable version of the Plugin.\n',
		'It goes through different steps: bumping the plugin version, tagging the release, and pushing the tag to GitHub.\n',
		'Once the tag is pushed to GitHub, GitHub will build the plugin ZIP, attach it to a release, publish it, and push the release to the SVN repository.\n',
		"To perform a release you'll have to be a member of the " +
			config.team +
			' Team.\n'
	);

	const version = await releasePlugin( false );

	log(
		'\n>> 🎉 ' +
			config.name +
			' ' +
			formats.success( version ) +
			' has been successfully tagged.\n',
		"In a few minutes, you'll be able to find the GitHub release here: " +
			formats.success(
				`${ config.wpRepositoryReleasesURL }v${ version }`
			) +
			'\n',
		"Once published, it'll be automatically uploaded to the WordPress plugin repository.\n",
		"Thanks for performing the release! and don't forget to publish the release post.\n"
	);
}

module.exports = {
	releaseRC,
	releaseStable,
};
