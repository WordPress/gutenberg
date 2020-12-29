#!/usr/bin/env node

/**
 * External dependencies
 */
const program = require( 'commander' );

const catchException = ( command ) => {
	return async ( ...args ) => {
		try {
			await command( ...args );
		} catch ( error ) {
			console.error( error );
			process.exitCode = 1;
		}
	};
};

/**
 * Internal dependencies
 */
const { releaseRC, releaseStable } = require( './commands/release' );
const {
	prepareLatestDistTag,
	prepareNextDistTag,
} = require( './commands/packages' );
const { getReleaseChangelog } = require( './commands/changelog' );
const { runPerformanceTests } = require( './commands/performance' );

program
	.command( 'release-plugin-rc' )
	.alias( 'rc' )
	.description( 'Release an RC version of the plugin' )
	.action( catchException( releaseRC ) );

program
	.command( 'release-plugin-stable' )
	.alias( 'stable' )
	.description( 'Release a stable version of the plugin' )
	.action( catchException( releaseStable ) );

program
	.command( 'prepare-packages-stable' )
	.alias( 'npm-stable' )
	.description(
		'Prepares the packages to be published to npm as stable (latest dist-tag, production version)'
	)
	.action( catchException( prepareLatestDistTag ) );

program
	.command( 'prepare-packages-rc' )
	.alias( 'npm-rc' )
	.description(
		'Prepares the packages to be published to npm as RC (next dist-tag, RC version)'
	)
	.action( catchException( prepareNextDistTag ) );

program
	.command( 'release-plugin-changelog' )
	.alias( 'changelog' )
	.option( '-m, --milestone <milestone>', 'Milestone' )
	.option( '-t, --token <token>', 'Github token' )
	.description( 'Generates a changelog from merged Pull Requests' )
	.action( catchException( getReleaseChangelog ) );

program
	.command( 'performance-tests [branches...]' )
	.alias( 'perf' )
	.option( '-c, --ci', 'Run in CI (non interactive)' )
	.option(
		'--tests-branch <branch>',
		"Use this branch's performance test files"
	)
	.description(
		'Runs performance tests on two separate branches and outputs the result'
	)
	.action( catchException( runPerformanceTests ) );

program.parse( process.argv );
