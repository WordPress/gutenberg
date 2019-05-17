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
		const status = await simpleGit.status();
		const parsedVersion = semver.parse( packageJson.version );
		if ( status.current !== 'master' ) {
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

		// Choosing the right version
		let nextVersion;
		if ( parsedVersion.minor === 9 ) {
			nextVersion = ( parsedVersion.major + 1 ) + '.0.0-rc.1';
		} else {
			nextVersion = parsedVersion.major + '.' + ( parsedVersion.minor + 1 ) + '.0-rc.1';
		}
		const { acceptVersion } = await inquirer.prompt( [ {
			type: 'confirm',
			name: 'acceptVersion',
			message: 'The RC Version to be applied is ' + success( nextVersion ) + '. Is this correct?',
			default: true,
		} ] );
		if ( ! acceptVersion ) {
			console.log( error( 'Aborting' ) );
			process.exit( 1 );
		}

		// Bumping the version in the different files (package.json, package-lock.json, gutenberg.php)
		const newPackageJson = {
			...packageJson,
			version: nextVersion,
		};
		await fs.writeFileSync( packageJsonPath, JSON.stringify( newPackageJson, null, '\t' ) + '\n' );
		const newPackageLock = {
			...packageLock,
			version: nextVersion,
		};
		await fs.writeFileSync( packageLockPath, JSON.stringify( newPackageLock, null, '\t' ) + '\n' );
		const content = await fs.readFileSync( pluginFilePath, 'utf8' );
		await fs.writeFileSync( pluginFilePath, content.replace( ' * Version: ' + packageJson.version, ' * Version: ' + nextVersion ) );

		console.log( success( 'The version has been updated, commit the diff to the release branch.' ) );
	} );

program.parse( process.argv );
