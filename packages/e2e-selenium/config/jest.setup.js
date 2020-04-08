const { webdriver, setupDriver } = require( './browserstack' );

jest.setTimeout( 10000 );

beforeAll( async function() {
	global.driver = await setupDriver();
	global.webdriver = webdriver;
	global.By = webdriver.By;
	global.until = webdriver.until;
} );

afterAll( async function() {
	driver.quit();
} );
