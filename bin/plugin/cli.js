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
const {
	publishNpmLatestDistTag,
	publishNpmBugfixLatestDistTag,
	publishNpmNextDistTag,
} = require( './commands/packages' );
const { getReleaseChangelog } = require( './commands/changelog' );
const { runPerformanceTests } = require( './commands/performance' );

const semverOption = [ '--semver <semver>', 'Semantic Versioning', 'patch' ];
const ciOption = [ '-c, --ci', 'Run in CI (non interactive)' ];
const repositoryPathOption = [
	'--repository-path <repository-path>',
	'Relative path to the git repository.',
];

program
	.command( 'publish-npm-packages-latest' )
	.alias( 'npm-latest' )
	.option( ...semverOption )
	.option( ...ciOption )
	.option( ...repositoryPathOption )
	.description(
		'Publishes packages to npm (latest dist-tag, production version)'
	)
	.action( catchException( publishNpmLatestDistTag ) );

program
	.command( 'publish-npm-packages-bugfix-latest' )
	.alias( 'npm-bugfix' )
	.option( ...semverOption )
	.option( ...ciOption )
	.option( ...repositoryPathOption )
	.description(
		'Publishes bugfixes for packages to npm (latest dist-tag, production version)'
	)
	.action( catchException( publishNpmBugfixLatestDistTag ) );

program
	.command( 'publish-npm-packages-next' )
	.alias( 'npm-next' )
	.option( ...semverOption )
	.option( ...ciOption )
	.option( ...repositoryPathOption )
	.description(
		'Publishes packages to npm (next dist-tag, prerelease version)'
	)
	.action( catchException( publishNpmNextDistTag ) );

program
	.command( 'release-plugin-changelog' )
	.alias( 'changelog' )
	.option( '-m, --milestone <milestone>', 'Milestone' )
	.option( '-t, --token <token>', 'GitHub token' )
	.option(
		'-u, --unreleased',
		"Only include PRs that haven't been included in a release yet"
	)
	.description( 'Generates a changelog from merged Pull Requests' )
	.action( catchException( getReleaseChangelog ) );

program
	.command( 'performance-tests [branches...]' )
	.alias( 'perf' )
	.option( ...ciOption )
	.option(
		'--tests-branch <branch>',
		"Use this branch's performance test files"
	)
	.option(
		'--wp-version <version>',
		'Specify a WordPress version on which to test all branches'
	)
	.description(
		'Runs performance tests on two separate branches and outputs the result'
	)
	.action( catchException( runPerformanceTests ) );

program.parse( process.argv );
