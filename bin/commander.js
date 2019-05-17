#!/usr/bin/env node

/* eslint-disable no-console */

const path = require( 'path' );
const program = require( 'commander' );
const inquirer = require( 'inquirer' );
const semver = require( 'semver' );
const chalk = require( 'chalk' );
const fs = require( 'fs' );

// Common info
const rootFolder = path.resolve( __dirname, '../' );
const packageJsonPath = rootFolder + '/package.json';
const packageLockPath = rootFolder + '/package-lock.json';
const pluginFilePath = rootFolder + '/gutenberg.php';
const packageJson = require( packageJsonPath );
const packageLock = require( packageLockPath );

// UI
const error = chalk.bold.red;
const success = chalk.bold.green;

program
	.command( 'release-plugin-rc' )
	.action( async () => {
		// Choosing the right version
		const parsedVersion = semver.parse( packageJson.version );
		let nextVersion;
		if ( parsedVersion.prerelease && parsedVersion.prerelease[ 0 ] === 'rc' ) {
			nextVersion = semver.inc( packageJson.version, 'prerelease', 'rc' );
		} else if ( parsedVersion.minor === 9 ) {
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

		console.log( success( 'The version has been updated, commit the diff.' ) );
	} );

program.parse( process.argv );
