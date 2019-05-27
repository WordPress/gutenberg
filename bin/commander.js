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

// Common info
const workingDirectoryPath = path.join( os.tmpdir(), uuid() );
const packageJsonPath = workingDirectoryPath + '/package.json';
const packageLockPath = workingDirectoryPath + '/package-lock.json';
const pluginFilePath = workingDirectoryPath + '/gutenberg.php';
const gutenbergZipPath = workingDirectoryPath + '/gutenberg.zip';
const repoOwner = 'WordPress';
const repoURL = 'git@github.com:' + repoOwner + '/gutenberg.git';

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
 * Clone the Gutenberg repository to the working directory.
 *
 * @param {string} abortMessage Abort message.
 */
async function runRepositoryCloneStep( abortMessage ) {
	// Cloning the repository
	await runStep( 'Cloning the repository', abortMessage, async () => {
		console.log( '>> Cloning the repository' );
		const simpleGit = SimpleGit();
		await simpleGit.clone( repoURL, workingDirectoryPath );
		console.log( '>> The gutenberg repository has been successfully cloned in the following temporary folder: ' + success( workingDirectoryPath ) );
	} );
}

/**
 * Clean the working directory.
 *
 * @param {string} abortMessage Abort message.
 */
async function runCleanLocalCloneStep( abortMessage ) {
	await runStep( 'Cleaning the temporary folder', abortMessage, async () => {
		await fs.remove( workingDirectoryPath );
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
		const simpleGit = SimpleGit( workingDirectoryPath );
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
		const simpleGit = SimpleGit( workingDirectoryPath );
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
		const simpleGit = SimpleGit( workingDirectoryPath );
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
		console.log( '>> The plugin version bump has been commited succesfully.' );
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
		await askForConfirmationToContinue(
			'Proceed and build the plugin zip? (It takes a few minutes)',
			true,
			abortMessage
		);
		childProcess.execSync( '/bin/bash bin/build-plugin-zip.sh', {
			cwd: workingDirectoryPath,
			env: {
				NO_CHECKS: true,
				PATH: process.env.PATH,
			},
			stdio: [ 'inherit', 'ignore', 'inherit' ],
		} );

		console.log( '>> The plugin zip has been built succesfully. Path: ' + success( gutenbergZipPath ) );
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
		const simpleGit = SimpleGit( workingDirectoryPath );
		await askForConfirmationToContinue(
			'Proceed with the creation of the git tag?',
			true,
			abortMessage
		);
		await simpleGit.addTag( 'v' + version );
		console.log( '>> The ' + success( 'v' + version ) + ' tag has been created succesfully.' );
	} );
}

/**
 * Push the local Git Changes and Tags to the remote repository.
 *
 * @param {string} abortMessage Abort message.
 */
async function runPushGitChangesStep( abortMessage ) {
	await runStep( 'Pushing the release branch and the tag', abortMessage, async () => {
		const simpleGit = SimpleGit( workingDirectoryPath );
		await askForConfirmationToContinue(
			'The release branch and the tag are going to be pushed to the remote repository. Continue?',
			true,
			abortMessage
		);
		await simpleGit.push( 'origin' );
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
			owner: repoOwner,
			repo: 'gutenberg',
			tag_name: 'v' + version,
			name: versionLabel,
			body: changelog,
			prerelease: isPrerelease,
		} );
		release = releaseData.data;

		console.log( '>> The GitHub release has been created succesfully.' );
	} );
	abortMessage = abortMessage + ' Make sure to remove the the GitHub release as well.';

	// Uploading the Gutenberg Zip to the release
	await runStep( 'Uploading the plugin zip', abortMessage, async () => {
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
		console.log( '>> The plugin zip has been succesfully uploaded.' );
	} );

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
		const simpleGit = SimpleGit( workingDirectoryPath );
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

	// Cloning the repository
	await runRepositoryCloneStep( abortMessage );

	// Creating the release branch
	const { version, versionLabel } = isRC ?
		await runReleaseBranchCreationStep( abortMessage ) :
		await runReleaseBranchCheckoutStep( abortMessage );

	// Bumping the version and commit.
	const commitHash = await runBumpPluginVersionAndCommitStep( version, abortMessage );

	// Plugin ZIP creation
	await runPluginZIPCreationStep();

	// Creating the git tag
	await runCreateGitTagStep( version, abortMessage );

	// Push the local changes
	await runPushGitChangesStep( abortMessage );
	abortMessage = 'Aborting! Make sure to ' + isRC ? 'remove' : 'reset' + ' the remote release branch and remove the git tag.';

	// Creating the GitHub Release
	const release = await runGithubReleaseStep( version, versionLabel, isRC, abortMessage );
	abortMessage = 'Aborting! Make sure to manually cherry-pick the ' + success( commitHash ) + ' commit to the master branch.';

	// Cherry-picking the bump commit into master
	await runCherrypickBumpCommitIntoMasterStep( commitHash, abortMessage );

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
			'Thanks for performing the release!'
		);
	} );

program.parse( process.argv );
