#!/usr/bin/env node

/* eslint-disable no-console */

// Dependencies
const path = require( 'path' );
const program = require( 'commander' );
const inquirer = require( 'inquirer' );
const semver = require( 'semver' );
const chalk = require( 'chalk' );
const fs = require( 'fs-extra' );
const SimpleGit = require( 'simple-git/promise' );
const childProcess = require( 'child_process' );
const Octokit = require( '@octokit/rest' );
const os = require( 'os' );
const uuid = require( 'uuid/v4' );

// Config
const gitRepoOwner = 'WordPress';
const gitRepoURL = 'git@github.com:' + gitRepoOwner + '/gutenberg.git';
const svnRepoURL = 'https://plugins.svn.wordpress.org/gutenberg';

// Working Directories
const gitWorkingDirectoryPath = path.join( os.tmpdir(), uuid() );
const svnWorkingDirectoryPath = path.join( os.tmpdir(), uuid() );

// UI
const error = chalk.bold.red;
const warning = chalk.bold.keyword( 'orange' );
const success = chalk.bold.green;

// Utils

/**
 * Asks the user for a confirmation to continue or abort otherwise
 *
 * @param {string} message      Confirmation message.
 * @param {boolean} isDefault   Default reply.
 * @param {string} abortMessage Abort message.
 */
async function askForConfirmationToContinue( message, isDefault = true, abortMessage = 'Aborting.' ) {
	const { isReady } = await inquirer.prompt( [ {
		type: 'confirm',
		name: 'isReady',
		default: isDefault,
		message,
	} ] );

	if ( ! isReady ) {
		console.log( error( '\n' + abortMessage ) );
		process.exit( 1 );
	}
}

/**
 * Common logic wrapping a step in the process.
 *
 * @param {string} name         Step name.
 * @param {string} abortMessage Abort message.
 * @param {function} handler    Step logic.
 */
async function runStep( name, abortMessage, handler ) {
	try {
		await handler();
	} catch ( exception ) {
		console.log(
			error( 'The following error happened during the "' + warning( name ) + '" step:' ) + '\n\n',
			exception,
			error( '\n\n' + abortMessage )
		);

		process.exit( 1 );
	}
}

/**
 * Utility to run a child script
 *
 * @param {string} script Script to run.
 * @param {string} cwd    Working directory.
 */
function runShellScript( script, cwd ) {
	childProcess.execSync( script, {
		cwd,
		env: {
			NO_CHECKS: true,
			PATH: process.env.PATH,
		},
		stdio: [ 'inherit', 'ignore', 'inherit' ],
	} );
}

// Steps

/**
 * Clone the Gutenberg repository to the working directory.
 *
 * @param {string} abortMessage Abort message.
 */
async function runGitRepositoryCloneStep( abortMessage ) {
	// Cloning the repository
	await runStep( 'Cloning the Git repository', abortMessage, async () => {
		console.log( '>> Cloning the Git repository' );
		const simpleGit = SimpleGit();
		await simpleGit.clone( gitRepoURL, gitWorkingDirectoryPath );
		console.log( '>> The Gutenberg Git repository has been successfully cloned in the following temporary folder: ' + success( gitWorkingDirectoryPath ) );
	} );
}

/**
 * Fetching the SVN Gutenberg repository to the working directory.
 *
 * @param {string} abortMessage Abort message.
 */
async function runSvnRepositoryCloneStep( abortMessage ) {
	// Cloning the repository
	await runStep( 'Fetching the SVN repository', abortMessage, async () => {
		console.log( '>> Fetching the SVN repository' );
		runShellScript( 'svn checkout ' + svnRepoURL + '/trunk ' + svnWorkingDirectoryPath );
		console.log( '>> The Gutenberg SVN repository has been successfully fetched in the following temporary folder: ' + success( svnWorkingDirectoryPath ) );
	} );
}

/**
 * Updates and commits the content of the SVN repo using the new plugin zip.
 *
 * @param {string} version      Version.
 * @param {string} changelog    Changelog.
 * @param {string} abortMessage Abort Message.
 */
async function runUpdateTrunkContentStep( version, changelog, abortMessage ) {
	// Updating the content of the svn
	await runStep( 'Updating trunk content', abortMessage, async () => {
		console.log( '>> Replacing trunk content using the new plugin zip' );

		// Delete everything except readme.txt and changelog.txt
		runShellScript( 'find . -maxdepth 1 -not -name "changelog.txt" -not -name "readme.txt" -not -name ".svn" -not -name "." -not -name ".." -exec rm -rf {} +', svnWorkingDirectoryPath );

		// Update the content using the plugin zip
		const gutenbergZipPath = gitWorkingDirectoryPath + '/gutenberg.zip';
		runShellScript( 'unzip ' + gutenbergZipPath + ' -d ' + svnWorkingDirectoryPath );

		console.log( '>> Updating the changelog in readme.txt and changelog.txt' );

		// Update the content of the readme.txt file
		const readmePath = svnWorkingDirectoryPath + '/readme.txt';
		const readmeFileContent = fs.readFileSync( readmePath, 'utf8' );
		const newReadmeContent =
			readmeFileContent.substr( 0, readmeFileContent.indexOf( '== Changelog ==' ) ) +
			'== Changelog ==\n\n' +
			changelog + '\n';
		fs.writeFileSync( readmePath, newReadmeContent );

		// Update the content of the changelog.txt file
		const changelogPath = svnWorkingDirectoryPath + '/changelog.txt';
		const changelogFileContent = fs.readFileSync( changelogPath, 'utf8' );
		const newChangelogContent =
			'== Changelog ==\n\n' +
			'= ' + version + ' =\n\n' +
			changelog +
			changelogFileContent.substr( changelogFileContent.indexOf( '== Changelog ==' ) + 16 );
		fs.writeFileSync( changelogPath, newChangelogContent );

		// Commit the content changes
		runShellScript( "svn st | grep '^\?' | awk '{print $2}' | xargs svn add", svnWorkingDirectoryPath );
		runShellScript( "svn st | grep '^!' | awk '{print $2}' | xargs svn rm", svnWorkingDirectoryPath );
		await askForConfirmationToContinue(
			'Trunk content has been updated, please check the SVN diff. Commit the changes?',
			true,
			abortMessage
		);

		runShellScript( 'svn commit -m "Committing Gutenberg version ' + version + '"', svnWorkingDirectoryPath );

		console.log( '>> Trunk has been successfully updated' );
	} );
}

/**
 * Creates a new SVN Tag
 *
 * @param {string} version      Version.
 * @param {string} abortMessage Abort Message.
 */
async function runSvnTagStep( version, abortMessage ) {
	await runStep( 'Creating the SVN Tag', abortMessage, async () => {
		await askForConfirmationToContinue(
			'Proceed with the creation of the SVN Tag?',
			true,
			abortMessage
		);
		runShellScript( 'svn cp ' + svnRepoURL + '/trunk ' + svnRepoURL + '/tags/' + version + ' -m "Tagging Gutenberg version ' + version + '"' );

		console.log( '>> The SVN ' + success( version ) + ' tag has been successfully created' );
	} );
}

/**
 * Updates the stable version of the plugin in the SVN repository.
 *
 * @param {string} version      Version.
 * @param {string} abortMessage Abort Message.
 */
async function updateThePluginStableVersion( version, abortMessage ) {
	// Updating the content of the svn
	await runStep( 'Updating the plugin\'s stable version', abortMessage, async () => {
		const readmePath = svnWorkingDirectoryPath + '/readme.txt';
		const readmeFileContent = fs.readFileSync( readmePath, 'utf8' );
		const newReadmeContent = readmeFileContent.replace(
			/Stable tag: [0-9]+.[0-9]+.[0-9]+\s*\n/,
			'Stable tag: ' + version + '\n'
		);
		fs.writeFileSync( readmePath, newReadmeContent );

		// Commit the content changes
		await askForConfirmationToContinue(
			'The stable version is updated in the readme.txt file. Commit the changes?',
			true,
			abortMessage
		);

		runShellScript( 'svn commit -m "Releasing Gutenberg version ' + version + '"', svnWorkingDirectoryPath );

		console.log( '>> Stable version updated successfully' );
	} );
}

/**
 * Clean the working directory.
 *
 * @param {string} abortMessage Abort message.
 */
async function runCleanLocalCloneStep( abortMessage ) {
	await runStep( 'Cleaning the temporary folder', abortMessage, async () => {
		await fs.remove( gitWorkingDirectoryPath );
		await fs.remove( svnWorkingDirectoryPath );
	} );
}

/**
 * Creates a new release branch based on the last package.json version
 * and chooses the next RC version number.
 *
 * @param {string} abortMessage Abort Message.
 *
 * @return {Object} chosen version and versionLabels.
 */
async function runReleaseBranchCreationStep( abortMessage ) {
	let version, releaseBranch, versionLabel;
	await runStep( 'Creating the release branch', abortMessage, async () => {
		const simpleGit = SimpleGit( gitWorkingDirectoryPath );
		const packageJsonPath = gitWorkingDirectoryPath + '/package.json';
		const packageJson = require( packageJsonPath );
		const parsedVersion = semver.parse( packageJson.version );

		// Follow the WordPress version guidelines to compute the version to be used
		// By default, increase the "minor" number but if we reach 9, bump to the next major.
		if ( parsedVersion.minor === 9 ) {
			version = ( parsedVersion.major + 1 ) + '.0.0-rc.1';
			releaseBranch = 'release/' + ( parsedVersion.major + 1 ) + '.0';
			versionLabel = ( parsedVersion.major + 1 ) + '.0.0 RC1';
		} else {
			version = parsedVersion.major + '.' + ( parsedVersion.minor + 1 ) + '.0-rc.1';
			releaseBranch = 'release/' + parsedVersion.major + '.' + ( parsedVersion.minor + 1 );
			versionLabel = parsedVersion.major + '.' + ( parsedVersion.minor + 1 ) + '.0 RC1';
		}
		await askForConfirmationToContinue(
			'The Plugin version to be used is ' + success( version ) + '. Proceed with the creation of the release branch?',
			true,
			abortMessage
		);

		// Creating the release branch
		await simpleGit.checkoutLocalBranch( releaseBranch );
		console.log( '>> The local release branch ' + success( releaseBranch ) + ' has been successfully created.' );
	} );

	return {
		version,
		versionLabel,
		releaseBranch,
	};
}

/**
 * Checkouts out the release branch and chooses a stable version number.
 *
 * @param {string} abortMessage Abort Message.
 *
 * @return {Object} chosen version and versionLabels.
 */
async function runReleaseBranchCheckoutStep( abortMessage ) {
	let releaseBranch, version;
	await runStep( 'Getting into the release branch', abortMessage, async () => {
		const simpleGit = SimpleGit( gitWorkingDirectoryPath );
		const packageJsonPath = gitWorkingDirectoryPath + '/package.json';
		const masterPackageJson = require( packageJsonPath );
		const masterParsedVersion = semver.parse( masterPackageJson.version );
		releaseBranch = 'release/' + masterParsedVersion.major + '.' + masterParsedVersion.minor;

		// Creating the release branch
		await simpleGit.checkout( releaseBranch );
		console.log( '>> The local release branch ' + success( releaseBranch ) + ' has been successfully checked out.' );

		const releaseBranchPackageJson = require( packageJsonPath );
		const releaseBranchParsedVersion = semver.parse( releaseBranchPackageJson.version );

		if ( releaseBranchParsedVersion.prerelease && releaseBranchParsedVersion.prerelease.length ) {
			version = releaseBranchParsedVersion.major + '.' + releaseBranchParsedVersion.minor + '.' + releaseBranchParsedVersion.patch;
		} else {
			version = releaseBranchParsedVersion.major + '.' + releaseBranchParsedVersion.minor + '.' + ( releaseBranchParsedVersion.patch + 1 );
		}

		await askForConfirmationToContinue(
			'The Version to release is ' + success( version ) + '. Proceed?',
			true,
			abortMessage
		);
	} );

	return {
		version,
		versionLabel: version,
		releaseBranch,
	};
}

/**
 * Bump the version in the different files (package.json, package-lock.json, gutenberg.php)
 * and commit the changes.
 *
 * @param {string} version      Version to use.
 * @param {string} abortMessage Abort message.
 *
 * @return {string} hash of the version bump commit.
 */
async function runBumpPluginVersionAndCommitStep( version, abortMessage ) {
	let commitHash;
	await runStep( 'Updating the plugin version', abortMessage, async () => {
		const simpleGit = SimpleGit( gitWorkingDirectoryPath );
		const packageJsonPath = gitWorkingDirectoryPath + '/package.json';
		const packageLockPath = gitWorkingDirectoryPath + '/package-lock.json';
		const pluginFilePath = gitWorkingDirectoryPath + '/gutenberg.php';
		const packageJson = require( packageJsonPath );
		const packageLock = require( packageLockPath );
		const newPackageJson = {
			...packageJson,
			version,
		};
		fs.writeFileSync( packageJsonPath, JSON.stringify( newPackageJson, null, '\t' ) + '\n' );
		const newPackageLock = {
			...packageLock,
			version,
		};
		fs.writeFileSync( packageLockPath, JSON.stringify( newPackageLock, null, '\t' ) + '\n' );
		const content = fs.readFileSync( pluginFilePath, 'utf8' );
		fs.writeFileSync( pluginFilePath, content.replace( ' * Version: ' + packageJson.version, ' * Version: ' + version ) );
		console.log( '>> The plugin version has been updated successfully.' );

		// Commit the version bump
		await askForConfirmationToContinue(
			'Please check the diff. Proceed with the version bump commit?',
			true,
			abortMessage
		);
		await simpleGit.add( [
			packageJsonPath,
			packageLockPath,
			pluginFilePath,
		] );
		const commitData = await simpleGit.commit( 'Bump plugin version to ' + version );
		commitHash = commitData.commit;
		console.log( '>> The plugin version bump has been commited successfully.' );
	} );

	return commitHash;
}

/**
 * Run the Plugin ZIP Creation step.
 *
 * @param {string} abortMessage Abort message.
 */
async function runPluginZIPCreationStep( abortMessage ) {
	await runStep( 'Plugin ZIP creation', abortMessage, async () => {
		const gutenbergZipPath = gitWorkingDirectoryPath + '/gutenberg.zip';
		await askForConfirmationToContinue(
			'Proceed and build the plugin zip? (It takes a few minutes)',
			true,
			abortMessage
		);
		runShellScript( '/bin/bash bin/build-plugin-zip.sh', gitWorkingDirectoryPath );

		console.log( '>> The plugin zip has been built successfully. Path: ' + success( gutenbergZipPath ) );
	} );
}

/**
 * Create a local Git Tag.
 *
 * @param {string} version      Version to use.
 * @param {string} abortMessage Abort message.
 */
async function runCreateGitTagStep( version, abortMessage ) {
	await runStep( 'Creating the git tag', abortMessage, async () => {
		const simpleGit = SimpleGit( gitWorkingDirectoryPath );
		await askForConfirmationToContinue(
			'Proceed with the creation of the git tag?',
			true,
			abortMessage
		);
		await simpleGit.addTag( 'v' + version );
		console.log( '>> The ' + success( 'v' + version ) + ' tag has been created successfully.' );
	} );
}

/**
 * Push the local Git Changes and Tags to the remote repository.
 *
 * @param {string} releaseBranch  Release branch name.
 * @param {string} abortMessage   Abort message.
 */
async function runPushGitChangesStep( releaseBranch, abortMessage ) {
	await runStep( 'Pushing the release branch and the tag', abortMessage, async () => {
		const simpleGit = SimpleGit( gitWorkingDirectoryPath );
		await askForConfirmationToContinue(
			'The release branch and the tag are going to be pushed to the remote repository. Continue?',
			true,
			abortMessage
		);
		await simpleGit.push( 'origin', releaseBranch );
		await simpleGit.pushTags( 'origin' );
	} );
}

/**
 * Creates the github release and uploads the Gutenberg ZIP file into it.
 *
 * @param {string}  version      Released version.
 * @param {string}  versionLabel Label of the released Version.
 * @param {boolean} isPrerelease is a pre-release.
 * @param {string}  abortMessage Abort message.
 *
 * @return {Object} Github release object.
 */
async function runGithubReleaseStep( version, versionLabel, isPrerelease, abortMessage ) {
	let octokit;
	let release;
	await runStep( 'Creating the GitHub release', abortMessage, async () => {
		await askForConfirmationToContinue(
			'Proceed with the creation of the GitHub release?',
			true,
			abortMessage
		);
		const { changelog } = await inquirer.prompt( [ {
			type: 'editor',
			name: 'changelog',
			message: 'Please provide the CHANGELOG of the release (markdown)',
		} ] );

		const { token } = await inquirer.prompt( [ {
			type: 'input',
			name: 'token',
			message: 'Please provide a GitHub personal authentication token. Navigate to ' + success( 'https://github.com/settings/tokens/new?scopes=repo,admin:org,write:packages' ) + ' to create one.',
		} ] );

		octokit = new Octokit( {
			auth: token,
		} );

		const releaseData = await octokit.repos.createRelease( {
			owner: gitRepoOwner,
			repo: 'gutenberg',
			tag_name: 'v' + version,
			name: versionLabel,
			body: changelog,
			prerelease: isPrerelease,
		} );
		release = releaseData.data;

		console.log( '>> The GitHub release has been created.' );
	} );
	abortMessage = abortMessage + ' Make sure to remove the the GitHub release as well.';

	// Uploading the Gutenberg Zip to the release
	await runStep( 'Uploading the plugin zip', abortMessage, async () => {
		const gutenbergZipPath = gitWorkingDirectoryPath + '/gutenberg.zip';
		const filestats = fs.statSync( gutenbergZipPath );
		await octokit.repos.uploadReleaseAsset( {
			url: release.upload_url,
			headers: {
				'content-length': filestats.size,
				'content-type': 'application/zip',
			},
			name: 'gutenberg.zip',
			file: fs.createReadStream( gutenbergZipPath ),
		} );
		console.log( '>> The plugin zip has been successfully uploaded.' );
	} );

	console.log( '>> The Github release is available here: ' + success( release.html_url ) );

	return release;
}

/**
 * Cherry-picks the version bump commit into master.
 *
 * @param {string} commitHash   Commit to cherry-pick.
 * @param {string} abortMessage Abort message.
 */
async function runCherrypickBumpCommitIntoMasterStep( commitHash, abortMessage ) {
	await runStep( 'Cherry-picking the bump commit into master', abortMessage, async () => {
		const simpleGit = SimpleGit( gitWorkingDirectoryPath );
		await askForConfirmationToContinue(
			'The plugin is now released. Proceed with the version bump in the master branch?',
			true,
			abortMessage
		);
		await simpleGit.fetch();
		await simpleGit.reset( 'hard' );
		await simpleGit.checkout( 'master' );
		await simpleGit.pull( 'origin', 'master' );
		await simpleGit.raw( [ 'cherry-pick', commitHash ] );
		await simpleGit.push( 'origin', 'master' );
	} );
}

/**
 * Release a new Gutenberg version.
 *
 * @param {boolean} isRC Whether it's an RC release or not.
 *
 * @return {Object} Github release object.
 */
async function releasePlugin( isRC = true ) {
	// This is a variable that contains the abort message shown when the script is aborted.
	let abortMessage = 'Aborting!';
	await askForConfirmationToContinue( 'Ready to go? ' );

	// Cloning the Git repository
	await runGitRepositoryCloneStep( abortMessage );

	// Creating the release branch
	const { version, versionLabel, releaseBranch } = isRC ?
		await runReleaseBranchCreationStep( abortMessage ) :
		await runReleaseBranchCheckoutStep( abortMessage );

	// Bumping the version and commit.
	const commitHash = await runBumpPluginVersionAndCommitStep( version, abortMessage );

	// Plugin ZIP creation
	await runPluginZIPCreationStep();

	// Creating the git tag
	await runCreateGitTagStep( version, abortMessage );

	// Push the local changes
	await runPushGitChangesStep( releaseBranch, abortMessage );
	abortMessage = 'Aborting! Make sure to ' + isRC ? 'remove' : 'reset' + ' the remote release branch and remove the git tag.';

	// Creating the GitHub Release
	const release = await runGithubReleaseStep( version, versionLabel, isRC, abortMessage );
	abortMessage = 'Aborting! Make sure to manually cherry-pick the ' + success( commitHash ) + ' commit to the master branch.';
	if ( ! isRC ) {
		abortMessage += ' Make sure to perform the SVN release manually as well.';
	}

	// Cherry-picking the bump commit into master
	await runCherrypickBumpCommitIntoMasterStep( commitHash, abortMessage );

	if ( ! isRC ) {
		abortMessage = 'Aborting! The Github release is done. Make sure to perform the SVN release manually.';

		await askForConfirmationToContinue( 'The Gihub release is complete. Proceed with the SVN release? ', abortMessage );

		// Fetching the SVN repository
		await runSvnRepositoryCloneStep( abortMessage );

		// Updating the SVN trunk content
		await runUpdateTrunkContentStep( version, release.body, abortMessage );

		abortMessage = 'Aborting! The Github release is done, SVN trunk updated. Make sure to create the SVN tag and update the stable version manually.';
		await runSvnTagStep( version, abortMessage );

		abortMessage = 'Aborting! The Github release is done, SVN tagged. Make sure to update the stable version manually.';
		await updateThePluginStableVersion( version, abortMessage );
	}

	abortMessage = 'Aborting! The release is finished though.';
	await runCleanLocalCloneStep( abortMessage );

	return release;
}

program
	.command( 'release-plugin-rc' )
	.alias( 'rc' )
	.description( 'Release an RC version of the plugin (supports only rc.1 for now)' )
	.action( async () => {
		console.log(
			chalk.bold( '💃 Time to release Gutenberg 🕺\n\n' ),
			'Welcome! This tool is going to help you release a new RC version of the Gutenberg Plugin.\n',
			'It goes throught different steps : creating the release branch, bumping the plugin version, tagging and creating the github release, building the zip...\n',
			'To perform a release you\'ll have to be a member of the Gutenberg Core Team.\n'
		);

		const release = await releasePlugin( true );

		console.log(
			'\n>> 🎉 The Gutenberg ' + success( release.name ) + ' has been successfully released.\n',
			'You can access the Github release here: ' + success( release.html_url ) + '\n',
			'Thanks for performing the release!'
		);
	} );

program
	.command( 'release-plugin-stable' )
	.alias( 'stable' )
	.description( 'Release a stable version of the plugin' )
	.action( async () => {
		console.log(
			chalk.bold( '💃 Time to release Gutenberg 🕺\n\n' ),
			'Welcome! This tool is going to help you release a new stable version of the Gutenberg Plugin.\n',
			'It goes throught different steps : bumping the plugin version, tagging and creating the github release, building the zip, pushing the release to the SVN repository...\n',
			'To perform a release you\'ll have to be a member of the Gutenberg Core Team.\n'
		);

		const release = await releasePlugin( false );

		console.log(
			'\n>> 🎉 The Gutenberg ' + success( release.name ) + ' has been successfully released.\n',
			'You can access the Github release here: ' + success( release.html_url ) + '\n',
			'In a few seconds, you\'ll be able to update the plugin from the WordPress repository.\n',
			'Thanks for performing the release! and don\'t forget to publish the release post.'
		);
	} );

program.parse( process.argv );
