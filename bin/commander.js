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
 * @param {string} message      Confirmation message
 * @param {boolean} isDefault   Default reply
 * @param {string} abortMessage Abort message
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

		await askForConfirmationToContinue( 'Ready go go? ' );

		// Check the current branch and if the versions
		const gitStatus = await simpleGit.status();
		const parsedVersion = semver.parse( packageJson.version );
		if ( gitStatus.current !== 'master' ) {
			await askForConfirmationToContinue(
				'Releasing plugin RC versions usually happens from the ' + warning( 'master' ) + ' branch. Do you want to continue from the current branch?',
				false,
			);
		}

		if ( gitStatus.files.length ) {
			await askForConfirmationToContinue(
				'Your working tree is dirty. Do you want to continue? (you may loose uncommited changes).',
				false,
			);
		}

		// Cleaning the repository
		const { skipCleaning } = await inquirer.prompt( [ {
			type: 'confirm',
			name: 'skipCleaning',
			message: 'Your working tree is going to be cleaned. Uncommited changes will be lost. Do you want to skip?',
			default: false,
		} ] );
		if ( ! skipCleaning ) {
			await simpleGit.clean( 'xfd' );
		}

		// Choosing the right version
		let nextVersion;
		let releaseBranch;
		if ( parsedVersion.minor === 9 ) {
			nextVersion = ( parsedVersion.major + 1 ) + '.0.0-rc.1';
			releaseBranch = 'release/' + ( parsedVersion.major + 1 ) + '.0';
		} else {
			nextVersion = parsedVersion.major + '.' + ( parsedVersion.minor + 1 ) + '.0-rc.1';
			releaseBranch = 'release/' + parsedVersion.major + '.' + ( parsedVersion.minor + 1 );
		}
		await askForConfirmationToContinue(
			'The RC Version to be applied is ' + success( nextVersion ) + '. Proceed with the creation of the release branch?'
		);

		// Creating the release branch
		await simpleGit.checkoutLocalBranch( releaseBranch );
		console.log( '>> The local release branch ' + success( releaseBranch ) + ' has been successfully created.' );

		// Bumping the version in the different files (package.json, package-lock.json, gutenberg.php)
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
			'Aborting. Make sure to remove the local release branch.'
		);
		await simpleGit.add( [
			packageJsonPath,
			packageLockPath,
			pluginFilePath,
		] );
		const { commit } = await simpleGit.commit( 'Bump plugin version to ' + nextVersion );
		console.log( '>> The plugin version bump was commited succesfully. Please push the release branch to the repository and cherry-pick the ' + success( commit ) + ' commit to the master branch.' );

		await askForConfirmationToContinue(
			'Proceed and build the plugin zip? (It takes a few minutes)',
			true,
			'Aborting. Make sure to remove the local release branch.'
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

program.parse( process.argv );
