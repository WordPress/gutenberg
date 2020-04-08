const {
	webdriver,
	setupDriver,
	startBrowserStackLocal,
	stopBrowserStackLocal,
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
	driver.quit();
	await stopBrowserStackLocal();
} );
