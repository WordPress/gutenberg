const webdriver = require( 'selenium-webdriver' );
const { capabilities } = require( './browserstack' );

jest.setTimeout( 10000 );

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
