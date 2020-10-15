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
const {
	askForConfirmation,
	runStep,
	readJSONFile,
	runShellScript,
} = require( '../lib/utils' );
const git = require( '../lib/git' );
const svn = require( '../lib/svn' );
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

const STABLE_TAG_REGEX = /Stable tag: [0-9]+\.[0-9]+\.[0-9]+\s*\n/;
const STABLE_TAG_PLACEHOLDER = 'Stable tag: V.V.V\n';

/**
 * Fetching the SVN repository to the working directory.
 *
 * @param {string} abortMessage Abort message.
 *
 * @return {Promise<string>} Repository local path.
 */
async function runSvnRepositoryCheckoutStep( abortMessage ) {
	// Cloning the repository
	let svnWorkingDirectoryPath;
	await runStep( 'Fetching the SVN repository', abortMessage, async () => {
		log( '>> Fetching the SVN repository' );
		svnWorkingDirectoryPath = svn.checkout( config.svnRepositoryURL );
		log(
			'>> The SVN repository has been successfully fetched in the following temporary folder: ' +
				formats.success( svnWorkingDirectoryPath )
		);
	} );

	return svnWorkingDirectoryPath;
}

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
 * Run the Plugin ZIP Creation step.
 *
 * @param {string} gitWorkingDirectoryPath Git Working Directory Path.
 * @param {string} abortMessage            Abort message.
 *
 * @return {Promise<string>} Plugin ZIP Path
 */
async function runPluginZIPCreationStep(
	gitWorkingDirectoryPath,
	abortMessage
) {
	const zipPath = gitWorkingDirectoryPath + '/' + config.slug + '.zip';
	await runStep( 'Plugin ZIP creation', abortMessage, async () => {
		await askForConfirmation(
			'Proceed and build the plugin ZIP? (It takes a few minutes)',
			true,
			abortMessage
		);
		runShellScript( config.buildZipCommand, gitWorkingDirectoryPath );
		log(
			'>> The plugin ZIP has been built successfully. Path: ' +
				formats.success( zipPath )
		);
	} );

	return zipPath;
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
 * Cherry-picks the version bump commit into master.
 *
 * @param {string} gitWorkingDirectoryPath Git Working Directory Path.
 * @param {string} commitHash   Commit to cherry-pick.
 * @param {string} abortMessage Abort message.
 */
async function runCherrypickBumpCommitIntoMasterStep(
	gitWorkingDirectoryPath,
	commitHash,
	abortMessage
) {
	await runStep(
		'Cherry-picking the bump commit into master',
		abortMessage,
		async () => {
			await askForConfirmation(
				'The plugin is now released. Proceed with the version bump in the master branch?',
				true,
				abortMessage
			);
			await git.discardLocalChanges( gitWorkingDirectoryPath );
			await git.resetLocalBranchAgainstOrigin(
				gitWorkingDirectoryPath,
				'master'
			);
			await git.cherrypickCommitIntoBranch(
				gitWorkingDirectoryPath,
				commitHash,
				'master'
			);
			await git.pushBranchToOrigin( gitWorkingDirectoryPath, 'master' );
		}
	);
}

/**
 * Creates the github release and uploads the ZIP file into it.
 *
 * @param {string}  zipPath       Plugin zip path.
 * @param {string}  version       Released version.
 * @param {string}  versionLabel  Label of the released Version.
 * @param {string}  changelog     Release changelog.
 * @param {boolean} isPrerelease  is a pre-release.
 * @param {string}  abortMessage  Abort message.
 *
 * @return {Promise<Object>} Github release object.
 */
async function runGithubReleaseStep(
	zipPath,
	version,
	versionLabel,
	changelog,
	isPrerelease,
	abortMessage
) {
	let octokit;
	let release;
	await runStep( 'Creating the GitHub release', abortMessage, async () => {
		await askForConfirmation(
			'Proceed with the creation of the GitHub release?',
			true,
			abortMessage
		);

		const { token } = await inquirer.prompt( [
			{
				type: 'input',
				name: 'token',
				message:
					'Please enter a GitHub personal authentication token.\n' +
					'You can create one by navigating to ' +
					formats.success(
						'https://github.com/settings/tokens/new?scopes=repo,admin:org,write:packages'
					) +
					'.\nToken:',
			},
		] );

		octokit = new Octokit( {
			auth: token,
		} );

		const releaseData = await octokit.repos.createRelease( {
			owner: config.githubRepositoryOwner,
			repo: config.githubRepositoryName,
			tag_name: 'v' + version,
			name: versionLabel,
			body: changelog,
			prerelease: isPrerelease,
		} );
		release = releaseData.data;

		log( '>> The GitHub release has been created.' );
	} );
	abortMessage =
		abortMessage + ' Make sure to remove the the GitHub release as well.';

	// Uploading the Zip to the Github release
	await runStep( 'Uploading the plugin ZIP', abortMessage, async () => {
		const filestats = fs.statSync( zipPath );
		await octokit.repos.uploadReleaseAsset( {
			url: release.upload_url,
			headers: {
				'content-length': filestats.size,
				'content-type': 'application/zip',
			},
			name: config.slug + '.zip',
			file: fs.createReadStream( zipPath ),
		} );
		log( '>> The plugin ZIP has been successfully uploaded.' );
	} );

	log(
		'>> The GitHub release is available here: ' +
			formats.success( release.html_url )
	);

	return release;
}

/**
 * Updates and commits the content of the SVN repo using the new plugin ZIP.
 *
 * @param {string} svnWorkingDirectoryPath SVN Working Directory Path.
 * @param {string} zipPath                 Plugin zip path.
 * @param {string} version                 Version.
 * @param {string} abortMessage            Abort Message.
 */
async function runUpdateTrunkContentStep(
	svnWorkingDirectoryPath,
	zipPath,
	version,
	abortMessage
) {
	// Updating the content of the svn
	await runStep( 'Updating trunk content', abortMessage, async () => {
		log( '>> Replacing trunk content using the new plugin ZIP' );

		const readmePath = svnWorkingDirectoryPath + '/readme.txt';

		const previousReadmeFileContent = fs.readFileSync( readmePath, 'utf8' );
		const stableTag = previousReadmeFileContent.match(
			STABLE_TAG_REGEX
		)[ 0 ];

		// Delete everything
		runShellScript(
			'find . -maxdepth 1 -not -name ".svn" -not -name "." -not -name ".." -exec rm -rf {} +',
			svnWorkingDirectoryPath
		);

		// Update the content using the plugin ZIP
		runShellScript( 'unzip ' + zipPath + ' -d ' + svnWorkingDirectoryPath );

		// Replace the stable tag placeholder with the existing stable tag on the SVN repository.
		const newReadmeFileContent = fs.readFileSync( readmePath, 'utf8' );
		fs.writeFileSync(
			readmePath,
			newReadmeFileContent.replace( STABLE_TAG_PLACEHOLDER, stableTag )
		);

		// Commit the content changes
		runShellScript(
			"svn st | grep '^?' | awk '{print $2}' | xargs svn add",
			svnWorkingDirectoryPath
		);
		runShellScript(
			"svn st | grep '^!' | awk '{print $2}' | xargs svn rm",
			svnWorkingDirectoryPath
		);
		await askForConfirmation(
			'Trunk content has been updated, please check the SVN diff. Commit the changes?',
			true,
			abortMessage
		);

		svn.commit( svnWorkingDirectoryPath, 'Committing version ' + version );
		log( '>> Trunk has been successfully updated' );
	} );
}

/**
 * Creates a new SVN Tag
 *
 * @param {string} version                 Version.
 * @param {string} abortMessage            Abort Message.
 */
async function runSvnTagStep( version, abortMessage ) {
	await runStep( 'Creating the SVN Tag', abortMessage, async () => {
		await askForConfirmation(
			'Proceed with the creation of the SVN Tag?',
			true,
			abortMessage
		);
		svn.tagTrunk(
			config.svnRepositoryURL,
			version,
			'Tagging version ' + version
		);
		log(
			'>> The SVN ' +
				formats.success( version ) +
				' tag has been successfully created'
		);
	} );
}

/**
 * Updates the stable version of the plugin in the SVN repository.
 *
 * @param {string} svnWorkingDirectoryPath SVN working directory.
 * @param {string} version                 Version.
 * @param {string} abortMessage            Abort Message.
 */
async function updateThePluginStableVersion(
	svnWorkingDirectoryPath,
	version,
	abortMessage
) {
	// Updating the content of the svn
	await runStep(
		"Updating the plugin's stable version",
		abortMessage,
		async () => {
			const readmePath = svnWorkingDirectoryPath + '/readme.txt';
			const readmeFileContent = fs.readFileSync( readmePath, 'utf8' );
			const newReadmeContent = readmeFileContent.replace(
				STABLE_TAG_REGEX,
				'Stable tag: ' + version + '\n'
			);
			fs.writeFileSync( readmePath, newReadmeContent );

			// Commit the content changes
			await askForConfirmation(
				'The stable version is updated in the readme.txt file. Commit the changes?',
				true,
				abortMessage
			);

			svn.commit(
				svnWorkingDirectoryPath,
				'Releasing version ' + version
			);

			log( '>> Stable version updated successfully' );
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
 * @return {Promise<Object>} Github release object.
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

	const versionLabel = version.replace( /\-rc\.([0-9]+)/, ' RC$1' );

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

	// Plugin ZIP creation
	const zipPath = await runPluginZIPCreationStep(
		gitWorkingDirectory,
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
		'Aborting! Make sure to ' +
		( isRC ? 'remove' : 'reset' ) +
		' the remote release branch and remove the git tag.';

	// Creating the GitHub Release
	const release = await runGithubReleaseStep(
		zipPath,
		version,
		versionLabel,
		changelog,
		isRC,
		abortMessage
	);

	abortMessage =
		'Aborting! Make sure to manually cherry-pick the ' +
		formats.success( commitHash ) +
		' commit to the master branch.';
	if ( ! isRC ) {
		abortMessage +=
			' Make sure to perform the SVN release manually as well.';
	}

	// Cherry-picking the bump commit into master
	await runCherrypickBumpCommitIntoMasterStep(
		gitWorkingDirectory,
		commitHash,
		abortMessage
	);

	if ( ! isRC ) {
		abortMessage =
			'Aborting! The GitHub release is done. Make sure to perform the SVN release manually.';

		await askForConfirmation(
			'The GitHub release is complete. Proceed with the SVN release? ',
			true,
			abortMessage
		);

		// Fetching the SVN repository
		const svnWorkingDirectory = await runSvnRepositoryCheckoutStep(
			abortMessage
		);
		temporaryFolders.push( svnWorkingDirectory );

		// Updating the SVN trunk content
		await runUpdateTrunkContentStep(
			svnWorkingDirectory,
			zipPath,
			version,
			abortMessage
		);

		abortMessage =
			'Aborting! The GitHub release is done, SVN trunk updated. Make sure to create the SVN tag and update the stable version manually.';
		await runSvnTagStep( version, abortMessage );

		abortMessage =
			'Aborting! The GitHub release is done, SVN tagged. Make sure to update the stable version manually.';
		await updateThePluginStableVersion(
			svnWorkingDirectory,
			version,
			abortMessage
		);
	}

	abortMessage = 'Aborting! The release is finished though.';
	await runCleanLocalFoldersStep( temporaryFolders, abortMessage );

	return release;
}

async function releaseRC() {
	log(
		formats.title( '\n💃 Time to release ' + config.name + ' 🕺\n\n' ),
		'Welcome! This tool is going to help you release a new RC version of the Plugin.\n',
		'It goes through different steps: creating the release branch, bumping the plugin version, tagging and creating the GitHub release, building the ZIP...\n',
		"To perform a release you'll have to be a member of the " +
			config.team +
			' Team.\n'
	);

	const release = await releasePlugin( true );

	log(
		'\n>> 🎉 The ' +
			config.name +
			' version ' +
			formats.success( release.name ) +
			' has been successfully released.\n',
		'You can access the GitHub release here: ' +
			formats.success( release.html_url ) +
			'\n',
		'Thanks for performing the release!\n'
	);
}

async function releaseStable() {
	log(
		formats.title( '\n💃 Time to release ' + config.name + ' 🕺\n\n' ),
		'Welcome! This tool is going to help you release a new stable version of the Plugin.\n',
		'It goes through different steps: bumping the plugin version, tagging and creating the GitHub release, building the ZIP, pushing the release to the SVN repository...\n',
		"To perform a release you'll have to be a member of the " +
			config.team +
			' Team.\n'
	);

	const release = await releasePlugin( false );

	log(
		'\n>> 🎉 ' +
			config.name +
			' ' +
			formats.success( release.name ) +
			' has been successfully released.\n',
		'You can access the GitHub release here: ' +
			formats.success( release.html_url ) +
			'\n',
		"In a few minutes, you'll be able to update the plugin from the WordPress repository.\n",
		"Thanks for performing the release! and don't forget to publish the release post.\n"
	);
}

module.exports = {
	releaseRC,
	releaseStable,
};
