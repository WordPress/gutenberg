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
	publishNpmGutenbergPlugin,
	publishNpmBugfixLatest,
	publishNpmBugfixWordPressCore,
	publishNpmNext,
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
		'Publishes to npm packages synced from the Gutenberg plugin (latest dist-tag, production version)'
	)
	.action( catchException( publishNpmGutenbergPlugin ) );

program
	.command( 'publish-npm-packages-bugfix-latest' )
	.alias( 'npm-bugfix' )
	.option( ...ciOption )
	.option( ...repositoryPathOption )
	.description(
		'Publishes to npm bugfixes for packages (latest dist-tag, production version)'
	)
	.action( catchException( publishNpmBugfixLatest ) );

program
	.command( 'publish-npm-packages-wordpress-core' )
	.alias( 'npm-wp' )
	.requiredOption( '--wp-version <wpVersion>', 'WordPress version' )
	.option( ...ciOption )
	.option( ...repositoryPathOption )
	.description(
		'Publishes to npm bugfixes targeting WordPress core (wp-X.Y dist-tag, production version)'
	)
	.action( catchException( publishNpmBugfixWordPressCore ) );

program
	.command( 'publish-npm-packages-next' )
	.alias( 'npm-next' )
	.option( ...semverOption )
	.option( ...ciOption )
	.option( ...repositoryPathOption )
	.description(
		'Publishes to npm development version of packages (next dist-tag, prerelease version)'
	)
	.action( catchException( publishNpmNext ) );

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
		'--rounds <count>',
		'Run each test suite this many times for each branch; results are summarized, default = 1'
	)
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
