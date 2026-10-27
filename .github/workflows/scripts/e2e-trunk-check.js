/**
 * Runs the e2e tests a pull request adds or changes, and warns on each one that
 * passes, since a bug fix's test should fail without the fix. Meant to run
 * against trunk's code with the pull request's spec files in place.
 *
 * Usage:
 *
 *     node e2e-trunk-check.js <pull request commit>
 *
 * A failing test is the expected result, so test results never fail this
 * script. Set `PLAYWRIGHT_JSON_OUTPUT_FILE` to where Playwright writes results.
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
// where the warning goes.
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
	for ( const spec of playwright( [ ...tests.keys() ].map( relative ) ) ) {
		if ( spec.tests[ 0 ].results[ 0 ]?.status === 'passed' ) {
			const line = tests.get( `${ spec.file }:${ spec.line }` );
			console.log(
				`::warning file=${ spec.file },line=${ line }::This test passes on trunk, so it doesn't prove the fix.`
			);
		}
	}
}
