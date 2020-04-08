const {
	webdriver,
	setupDriver,
	startBrowserStackLocal,
	stopBrowserStackLocal,
	getResultPageLink,
} = require( './browserstack' );

jest.setTimeout( 30000 );

beforeAll( async function() {
	await startBrowserStackLocal();
	global.driver = await setupDriver();
	global.webdriver = webdriver;
	global.By = webdriver.By;
	global.until = webdriver.until;
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
