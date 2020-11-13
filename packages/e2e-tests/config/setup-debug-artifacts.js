/**
 * External dependencies
 */
const fs = require( 'fs' );
const { spawn } = require( 'child_process' );
const util = require( 'util' );
const root = process.env.GITHUB_WORKSPACE || __dirname + '/../../../';
const ARTIFACTS_PATH = root + '/artifacts';
const TMP_PATH = ARTIFACTS_PATH + '/tmp';

const writeFile = util.promisify( fs.writeFile );

for ( const path of [ ARTIFACTS_PATH, TMP_PATH ] ) {
	if ( ! fs.existsSync( path ) ) {
		fs.mkdirSync( path );
	}
}
// afterAll( () => fs.rmdirSync( TMP_PATH ) );

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
	specStarted: () => startVideo(),
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
	await stopVideo();
	await encodeVideo( `${ ARTIFACTS_PATH }/${ slug }-video.mp4` );
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

let frames = [];
let session;

const startVideo = async () => {
	frames = [];
	if ( ! session ) {
		session = await page.target().createCDPSession();
	}
	await session.send( 'Page.startScreencast', {
		format: 'png',
		everyNthFrame: 1,
	} );
	session.on( 'Page.screencastFrame', ( event ) => {
		frames.push( Buffer.from( event.data, 'base64' ) );
	} );
};
const stopVideo = () => {
	session.send( 'Page.stopScreencast' );
};
const encodeVideo = async ( outfile ) => {
	if ( ! frames.length ) {
		return;
	}

	for ( let i = 0, max = frames.length; i < max; i++ ) {
		fs.writeFileSync( `${ TMP_PATH }/${ i }.png`, frames[ i ] );
	}

	const ffmpeg = spawn( 'ffmpeg', [
		'-framerate',
		'5',
		'-pattern_type',
		'glob',
		'-i',
		`${ TMP_PATH }/*.png`,
		'-c:v',
		'libx264',
		'-r',
		'30',
		'-pix_fmt',
		'yuv420p',
		outfile,
	] );

	const closed = new Promise( ( resolve, reject ) => {
		ffmpeg.on( 'error', reject );
		ffmpeg.on( 'close', resolve );
	} );

	await closed;

	for ( let i = 0, max = frames.length; i < max; i++ ) {
		try {
			fs.unlinkSync( `${ TMP_PATH }/${ i }.png` );
		} catch ( e ) {}
	}
};
