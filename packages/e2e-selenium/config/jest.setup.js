const got = require( 'got' ).default;

const {
	webdriver,
	setupDriver,
	startBrowserStackLocal,
	stopBrowserStackLocal,
	getResultPageLink,
} = require( './browserstack' );

const { closeWelcomeGuide } = require( '../util' );

global.WP_BASE_URL = 'http://localhost:8889';
global.WP_ADMIN_BASE_URL = `${ WP_BASE_URL }/wp-admin`;

got( WP_BASE_URL ).catch( ( reason ) => {
	if ( reason.code === 'ECONNREFUSED' ) {
		throw new Error(
			'Cannot connect to the test website. Did you turn it on with "npx wp-env start"?'
		);
	}
} );

// IE is super slow. So, we give each test 5 minutes.
jest.setTimeout( 300000 );

beforeAll( async function() {
	await startBrowserStackLocal();
	global.driver = await setupDriver();
	global.webdriver = webdriver;
	global.By = webdriver.By;
	global.until = webdriver.until;
	global.Key = webdriver.Key;

	await closeWelcomeGuide();
} );

afterAll( async function() {
	const session = await driver.getSession();
	const sessionId = await session.getId();

	driver.quit();
	await stopBrowserStackLocal();

	const resultPage = await getResultPageLink( sessionId );

	// process.stdout.write is overwritten in jest.
	// eslint-disable-next-line no-console
	console.log( `You can watch the result at ${ resultPage }` );
} );
