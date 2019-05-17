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

program
	.command( 'release-plugin-rc' )
	.alias( 'rc' )
	.description( 'Release an RC version of the plugin (supports only rc.1 for now)' )
	.action( async () => {
		// Check the current branch and if the versions
		const gitStatus = await simpleGit.status();
		const parsedVersion = semver.parse( packageJson.version );
		if ( gitStatus.current !== 'master' ) {
			const { acceptBranch } = await inquirer.prompt( [ {
				type: 'confirm',
				name: 'acceptBranch',
				message: 'Releasing plugin RC versions usually happens from the ' + warning( 'master' ) + ' branch. Do you want to continue from the current branch?',
				default: false,
			} ] );

			if ( ! acceptBranch ) {
				console.log( error( 'Aborting' ) );
				process.exit( 1 );
			}
		}
		if ( gitStatus.files.length ) {
			const { acceptLocalChanges } = await inquirer.prompt( [ {
				type: 'confirm',
				name: 'acceptLocalChanges',
				message: 'Your working tree is dirty. Do you want to continue? (some changes might be inadvertantly commited)',
				default: false,
			} ] );

			if ( ! acceptLocalChanges ) {
				console.log( error( 'Aborting' ) );
				process.exit( 1 );
			}
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
		const { acceptVersion } = await inquirer.prompt( [ {
			type: 'confirm',
			name: 'acceptVersion',
			message: 'The RC Version to be applied is ' + success( nextVersion ) + '. Proceed with the creation of the release branch?',
			default: true,
		} ] );
		if ( ! acceptVersion ) {
			console.log( error( 'Aborting' ) );
			process.exit( 1 );
		}

		// Creating the release branch
		await simpleGit.checkoutLocalBranch( releaseBranch );
		console.log( '>> The local release branch "' + success( releaseBranch ) + '" has been successfully created.' );

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
		const { acceptDiff } = await inquirer.prompt( [ {
			type: 'confirm',
			name: 'acceptDiff',
			message: 'Please check the diff. Proceed with the version bump commit?',
			default: true,
		} ] );
		if ( ! acceptDiff ) {
			console.log( error( 'Aborting. Make sure to remove the local release branch' ) );
			process.exit( 1 );
		}
		await simpleGit.add( [
			packageJsonPath,
			packageLockPath,
			pluginFilePath,
		] );
		const { commit } = await simpleGit.commit( 'Bump plugin version to ' + nextVersion );

		console.log( '>> The plugin version bump was commited succesfully. Please push the release branch to the repository and cherry-pick the ' + success( commit ) + ' commit to the master branch.' );
	} );

program.parse( process.argv );
