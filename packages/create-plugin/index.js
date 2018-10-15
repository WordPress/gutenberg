#!/usr/bin/env node

/**
 * External dependencies
 */
const chalk = require( 'chalk' );

/**
 * Internal dependencies
 */
const main = require( './cli/main' );

/**
 * Node Version Info
 */
const currentNodeVersion = process.versions.node;
const semver = currentNodeVersion.split( '.' );
const major = semver[ 0 ];

/**
 * Check node version
 */
if ( major < 8 ) {
	// eslint-disable-next-line no-console
	console.error(
		chalk.red(
			'You Node Version is' +
          currentNodeVersion +
          '.\n' +
          'Create WP Plugin requires Node 8 or higher. \n' +
          'Kindly update your Node.'
		)
	);
	process.exit( 1 );
}

/**
 * Start Tool
 */
main();
