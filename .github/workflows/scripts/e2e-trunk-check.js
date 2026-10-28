/**
 * Runs the e2e tests a pull request adds or changes, since a bug fix needs at
 * least one test that fails without it. Adds a notice on each test that fails,
 * or a warning on each test when none fail. Meant to run against trunk's code
 * with the pull request's test code in place.
 *
 * Usage:
 *
 *     node e2e-trunk-check.js <pull request commit>
 *
 * A failing test is the expected result, so test results never fail this
 * script; only a setup that runs no test does. Set `PLAYWRIGHT_JSON_OUTPUT_FILE` to where Playwright writes results.
 */

const { execFileSync } = require( 'node:child_process' );
const { readFileSync } = require( 'node:fs' );

const SPECS = 'test/e2e/specs/';
const [ pullRequestCommit ] = process.argv.slice( 2 );

/**
 * Runs Playwright in Chromium and reads back its tests.
 *
 * @param {string[]} args Playwright arguments.
 * @return {Object[]} Each test, with its file relative to the repository.
 */
function playwright( args ) {
	try {
		execFileSync(
			'npm',
			[
				'run',
				'--workspace',
				'@wordpress/e2e-tests-playwright',
				'test:e2e',
				'--',
				'--project=chromium',
				'--retries=0',
				'--reporter=json',
				...args,
			],
			{ stdio: 'inherit' }
		);
	} catch {
		// Playwright exits with an error when a test fails.
	}
	const specsOf = ( suite ) => [
		...( suite.specs ?? [] ),
		...( suite.suites ?? [] ).flatMap( specsOf ),
	];
	const report = JSON.parse(
		readFileSync( process.env.PLAYWRIGHT_JSON_OUTPUT_FILE, 'utf8' )
	);
	return report.suites
		.flatMap( specsOf )
		.map( ( spec ) => ( { ...spec, file: SPECS + spec.file } ) );
}

// Playwright takes paths relative to its own directory.
const relative = ( path ) => path.replace( 'test/e2e/', '' );

// The lines the pull request adds or changes, per file.
const changed = {};
let file;
const diff = execFileSync( 'git', [
	'diff',
	'-U0',
	'HEAD',
	pullRequestCommit,
	'--',
	SPECS,
] ).toString();
for ( const line of diff.split( '\n' ) ) {
	file = line.startsWith( '+++ b/' ) ? line.slice( 6 ) : file;
	const hunk = line.match( /^@@ .* \+(\d+)(?:,(\d+))? @@/ );
	for ( let i = 0; hunk && i < ( hunk[ 2 ] ?? 1 ); i++ ) {
		( changed[ file ] ??= [] ).push( Number( hunk[ 1 ] ) + i );
	}
}

// A test changed when a changed line falls between its first line and its
// closing brace, found by its indentation. Keep the first such line, which is
// where the annotation goes.
const tests = new Map();
for ( const spec of playwright( [
	'--list',
	...Object.keys( changed ).map( relative ),
] ) ) {
	const source = readFileSync( spec.file, 'utf8' ).split( '\n' );
	const indent = source[ spec.line - 1 ].match( /^\s*/ )[ 0 ];
	const end = source.findIndex(
		( text, i ) => i >= spec.line && text.startsWith( `${ indent }}` )
	);
	const line = changed[ spec.file ]?.find(
		( l ) => l >= spec.line && l <= end + 1
	);
	if ( line ) {
		tests.set( `${ spec.file }:${ spec.line }`, line );
	}
}

if ( tests.size ) {
	// Playwright matches the file part of each argument as a pattern, so it
	// can run other tests too.
	const results = playwright( [ ...tests.keys() ].map( relative ) )
		.filter( ( spec ) => tests.has( `${ spec.file }:${ spec.line }` ) )
		.map( ( spec ) => ( {
			path: spec.file,
			line: tests.get( `${ spec.file }:${ spec.line }` ),
			status: spec.tests[ 0 ].results[ 0 ]?.status,
		} ) );
	// Without any result, the setup broke, which says nothing about the tests.
	if ( ! results.some( ( { status } ) => status ) ) {
		throw new Error( 'No test ran on trunk.' );
	}
	const failing = results.filter( ( { status } ) =>
		[ 'failed', 'timedOut' ].includes( status )
	);
	for ( const { path, line } of failing ) {
		console.log(
			`::notice file=${ path },line=${ line }::This test fails on trunk, a good sign that it catches the bug.`
		);
	}
	if ( ! failing.length ) {
		for ( const { path, line, status } of results ) {
			if ( status === 'passed' ) {
				console.log(
					`::warning file=${ path },line=${ line }::No new or changed test fails on trunk, so none of them catches the bug.`
				);
			}
		}
	}
}
