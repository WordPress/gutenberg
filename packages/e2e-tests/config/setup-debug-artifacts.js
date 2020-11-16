/**
 * External dependencies
 */
const fs = require( 'fs' );
const util = require( 'util' );
const root = process.env.GITHUB_WORKSPACE || process.cwd();
const ARTIFACTS_PATH = root + '/artifacts';

const writeFile = util.promisify( fs.writeFile );

if ( ! fs.existsSync( ARTIFACTS_PATH ) ) {
	fs.mkdirSync( ARTIFACTS_PATH );
}

/**
 * Gutenberg uses the default jest-jasmine2 test runner that comes with Jest.
 * Unfortunately, version 2 of jasmine doesn't support async reporters. It
 * does support async before and after hooks though,  so the workaround here
 * works by making each test wait for the artifacts before starting.
 *
 * Kudos to Tom Esterez (@testerez) for sharing this idea in https://github.com/smooth-code/jest-puppeteer/issues/131#issuecomment-424073620
 */
let artifactsPromise;
// eslint-disable-next-line jest/no-jasmine-globals
jasmine.getEnv().addReporter( {
	specDone: ( result ) => {
		if ( result.status === 'failed' ) {
			artifactsPromise = storeArtifacts( result.fullName );
		}
	},
} );

beforeEach( () => artifactsPromise );
afterAll( () => artifactsPromise );

async function storeArtifacts( testName ) {
	const slug = slugify( testName );
	await writeFile(
		`${ ARTIFACTS_PATH }/${ slug }-snapshot.html`,
		await page.content()
	);
	await page.screenshot( { path: `${ ARTIFACTS_PATH }/${ slug }.jpg` } );
}

function slugify( testName ) {
	const datetime = new Date().toISOString().split( '.' )[ 0 ];
	const readableName = `${ testName } ${ datetime }`;
	const slug = readableName
		.toLowerCase()
		.replace( /:/g, '-' )
		.replace( /[^0-9a-zA-Z \-\(\)]/g, '' )
		.replace( / /g, '-' );
	return slug;
}
