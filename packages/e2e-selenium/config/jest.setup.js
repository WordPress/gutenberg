const webdriver = require( 'selenium-webdriver' );
require( 'dotenv' ).config();

jest.setTimeout( 10000 );

// Input capabilities
const capabilities = {
	browserName: 'IE',
	browser_version: '11.0',
	os: 'Windows',
	os_version: '10',
	resolution: '1024x768',
	'browserstack.user': process.env.LOCAL_BROWSERSTACK_USER,
	'browserstack.key': process.env.LOCAL_BROWSERSTACK_KEY,
	name: 'Bstack-[Node] Sample Test',
};

beforeAll( async function() {
	const driver = new webdriver.Builder()
		.usingServer( 'http://hub-cloud.browserstack.com/wd/hub' )
		.withCapabilities( capabilities )
		.build();

	global.driver = await driver;
	global.webdriver = webdriver;
	global.By = webdriver.By;
	global.until = webdriver.until;
} );

afterAll( async function() {
	driver.quit();
} );
