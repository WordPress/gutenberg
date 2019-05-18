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

// Common info
const rootFolder = path.resolve( __dirname, '../' );
const packageJsonPath = rootFolder + '/package.json';
const packageLockPath = rootFolder + '/package-lock.json';
const pluginFilePath = rootFolder + '/gutenberg.php';
const packageJson = require( packageJsonPath );
const packageLock = require( packageLockPath );
const simpleGit = SimpleGit( rootFolder );

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
			error( 'The following error happened during the step: ' ) + warning( name ) + '\n\n',
			exception,
			error( '\n' + abortMessage )
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
				message: 'Your working tree is going to be cleaned. Uncommited changes will be lost. Do you want to skip?',
				default: false,
			} ] );
			if ( ! skipCleaning ) {
				await simpleGit.clean( 'xfd' );
			}
		} );

		// Creating the release branch
		let nextVersion;
		let releaseBranch;
		await runStep( 'Creating the release branch', abortMessage, async () => {
			const parsedVersion = semver.parse( packageJson.version );
			if ( parsedVersion.minor === 9 ) {
				nextVersion = ( parsedVersion.major + 1 ) + '.0.0-rc.1';
				releaseBranch = 'release/' + ( parsedVersion.major + 1 ) + '.0';
			} else {
				nextVersion = parsedVersion.major + '.' + ( parsedVersion.minor + 1 ) + '.0-rc.1';
				releaseBranch = 'release/' + parsedVersion.major + '.' + ( parsedVersion.minor + 1 );
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
			const { commit } = await simpleGit.commit( 'Bump plugin version to ' + nextVersion );
			console.log( '>> The plugin version bump was commited succesfully. Please push the release branch to the repository and cherry-pick the ' + success( commit ) + ' commit to the master branch.' );
		} );

		// Creating the release tag
		await runStep( 'Creating the release tag', abortMessage, async () => {
			// Commit the version bump
			await askForConfirmationToContinue(
				'Proceed with the creation of the release tag?',
				true,
				abortMessage
			);
			await simpleGit.addTag( 'v' + nextVersion );
			console.log( '>> The ' + success( 'v' + nextVersion ) + ' tag was created succesfully.' );
		} );
		abortMessage = 'Aborting. Make sure to remove the local release branch and the local release tag.';

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

			console.log( '>> The plugin zip was built succesfully 🎉. Path: ' + success( rootFolder + '/gutenberg.zip' ) );
		} );
	} );

program.parse( process.argv );
