#!/usr/bin/env node

/* eslint-disable no-console */

// Dependencies
const path = require( 'path' );
const program = require( 'commander' );
const inquirer = require( 'inquirer' );
const semver = require( 'semver' );
const chalk = require( 'chalk' );
const fs = require( 'fs' );
const SimpleGit = require( 'simple-git/promise' );
const childProcess = require( 'child_process' );
const Octokit = require( '@octokit/rest' );

// Common info
const rootFolder = path.resolve( __dirname, '../' );
const packageJsonPath = rootFolder + '/package.json';
const packageLockPath = rootFolder + '/package-lock.json';
const pluginFilePath = rootFolder + '/gutenberg.php';
const packageJson = require( packageJsonPath );
const packageLock = require( packageLockPath );
const simpleGit = SimpleGit( rootFolder );
const gutenbergZipPath = rootFolder + '/gutenberg.zip';
const gitRemote = 'origin';
const repoOwner = 'WordPress';

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
const askForConfirmationToContinue = async ( message, isDefault = true, abortMessage = 'Aborting.' ) => {
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
};

/**
 * Common logic wrapping a step in the process.
 *
 * @param {string} name         Step name.
 * @param {string} abortMessage Abort message.
 * @param {function} handler    Step logic.
 */
const runStep = async ( name, abortMessage, handler ) => {
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
};

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

		// This is a variable that contains the abort message shown when the script is aborted.
		let abortMessage = 'Aborting!';

		// Initial checks
		await runStep( 'Initial checks', abortMessage, async () => {
			await askForConfirmationToContinue( 'Ready go go? ' );
			// Check the current branch and if the versions
			const gitStatus = await simpleGit.status();
			if ( gitStatus.current !== 'master' ) {
				await askForConfirmationToContinue(
					'Releasing plugin RC versions usually happens from the ' + warning( 'master' ) + ' branch. Do you want to continue from the current branch?',
					false,
					abortMessage
				);
			}

			if ( gitStatus.files.length ) {
				await askForConfirmationToContinue(
					'Your working tree is dirty. Do you want to continue? (you may loose uncommited changes).',
					false,
					abortMessage
				);
			}
		} );

		// Cleaning the repository
		await runStep( 'Cleaning the repository', abortMessage, async () => {
			const { skipCleaning } = await inquirer.prompt( [ {
				type: 'confirm',
				name: 'skipCleaning',
				message: 'Your working tree is going to be cleaned. Uncommited changes will be lost. Do you want to skip this step?',
				default: false,
			} ] );
			if ( ! skipCleaning ) {
				await simpleGit.clean( 'xfd' );
			}
		} );

		// Creating the release branch
		let nextVersion;
		let nextVersionLabel;
		let releaseBranch;
		await runStep( 'Creating the release branch', abortMessage, async () => {
			const parsedVersion = semver.parse( packageJson.version );
			if ( parsedVersion.minor === 9 ) {
				nextVersion = ( parsedVersion.major + 1 ) + '.0.0-rc.1';
				releaseBranch = 'release/' + ( parsedVersion.major + 1 ) + '.0';
				nextVersionLabel = ( parsedVersion.major + 1 ) + '.0.0 RC1';
			} else {
				nextVersion = parsedVersion.major + '.' + ( parsedVersion.minor + 1 ) + '.0-rc.1';
				releaseBranch = 'release/' + parsedVersion.major + '.' + ( parsedVersion.minor + 1 );
				nextVersionLabel = parsedVersion.major + '.' + ( parsedVersion.minor + 1 ) + '.0 RC1';
			}
			await askForConfirmationToContinue(
				'The RC Version to be applied is ' + success( nextVersion ) + '. Proceed with the creation of the release branch?',
				true,
				abortMessage
			);

			// Creating the release branch
			await simpleGit.checkoutLocalBranch( releaseBranch );
			console.log( '>> The local release branch ' + success( releaseBranch ) + ' has been successfully created.' );
		} );
		abortMessage = 'Aborting. Make sure to remove the local release branch.';

		// Bumping the version in the different files (package.json, package-lock.json, gutenberg.php)
		let commitHash;
		await runStep( 'Updating the plugin version', abortMessage, async () => {
			const newPackageJson = {
				...packageJson,
				version: nextVersion,
			};
			fs.writeFileSync( packageJsonPath, JSON.stringify( newPackageJson, null, '\t' ) + '\n' );
			const newPackageLock = {
				...packageLock,
				version: nextVersion,
			};
			fs.writeFileSync( packageLockPath, JSON.stringify( newPackageLock, null, '\t' ) + '\n' );
			const content = fs.readFileSync( pluginFilePath, 'utf8' );
			fs.writeFileSync( pluginFilePath, content.replace( ' * Version: ' + packageJson.version, ' * Version: ' + nextVersion ) );
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
			const commitData = await simpleGit.commit( 'Bump plugin version to ' + nextVersion );
			commitHash = commitData.commit;
			console.log( '>> The plugin version bump has been commited succesfully.' );
		} );

		// Plugin ZIP creation
		await runStep( 'Plugin ZIP creation', abortMessage, async () => {
			await askForConfirmationToContinue(
				'Proceed and build the plugin zip? (It takes a few minutes)',
				true,
				abortMessage
			);
			childProcess.execSync( '/bin/bash bin/build-plugin-zip.sh', {
				cwd: rootFolder,
				env: {
					NO_CHECKS: true,
					PATH: process.env.PATH,
				},
				stdio: [ 'inherit', 'ignore', 'inherit' ],
			} );

			console.log( '>> The plugin zip has been built succesfully. Path: ' + success( gutenbergZipPath ) );
		} );

		// Creating the git tag
		await runStep( 'Creating the git tag', abortMessage, async () => {
			await askForConfirmationToContinue(
				'Proceed with the creation of the git tag?',
				true,
				abortMessage
			);
			await simpleGit.addTag( 'v' + nextVersion );
			console.log( '>> The ' + success( 'v' + nextVersion ) + ' tag has been created succesfully.' );
		} );
		abortMessage = 'Aborting. Make sure to remove the local release branch and the local git tag.';

		await runStep( 'Pushing the release branch and the tag', abortMessage, async () => {
			await askForConfirmationToContinue(
				'The release branch and the tag are going to be pushed to the remote repository. Continue?',
				true,
				abortMessage
			);
			await simpleGit.push( gitRemote, releaseBranch );
			await simpleGit.pushTags( gitRemote );
		} );
		abortMessage = 'Aborting. Make sure to remove the local and remote release branches and tags.';

		// Creating the GitHub Release
		let octokit;
		let release;
		await runStep( 'Creating the Github release', abortMessage, async () => {
			await askForConfirmationToContinue(
				'Proceed with the creation of the Github release?',
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
				message: 'Please provide a Github personal authentication token. (Navigate to ' + success( 'https://github.com/settings/tokens' ) + ' to create one with admin:org, repo and write:packages rights)',
			} ] );

			octokit = new Octokit( {
				auth: token,
			} );

			const releaseData = await octokit.repos.createRelease( {
				owner: repoOwner,
				repo: 'gutenberg',
				tag_name: 'v' + nextVersion,
				name: nextVersionLabel,
				body: changelog,
				prerelease: true,
			} );
			release = releaseData.data;

			console.log( '>> The Github release has been created succesfully.' );
		} );
		abortMessage = 'Aborting. Make sure to remove the local and remote releases branches and tags and the Github release.';

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
		abortMessage = 'Aborting. Make sure to manually cherry-pick the ' + success( commitHash ) + ' commit to the master branch.';

		// Cherry-picking the bump commit into master
		await runStep( 'Cherry-picking the bump commit into master', abortMessage, async () => {
			await askForConfirmationToContinue(
				'The plugin RC is now released. Proceed with the version bump in the master branch?',
				true,
				'test'
			);
			await simpleGit.fetch();
			await simpleGit.checkout( 'master' );
			await simpleGit.pull( gitRemote, 'master' );
			await simpleGit.raw( [ 'cherry-pick', commitHash ] );
			await simpleGit.push( gitRemote, 'master' );
		} );

		console.log(
			'\n>> 🎉 The Gutenberg ' + success( nextVersionLabel ) + '  has been successfully released.\n',
			'You can access the Github release here: ' + success( release.html_url ) + '\n',
			'Thanks for performing the release!'
		);
	} );

program.parse( process.argv );
