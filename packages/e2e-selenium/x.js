const webdriver = require( 'selenium-webdriver' );
require( 'dotenv' ).config();

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

const driver = new webdriver.Builder()
	.usingServer( 'http://hub-cloud.browserstack.com/wd/hub' )
	.withCapabilities( capabilities )
	.build();

driver.get( 'http://www.google.com' ).then( function() {
	driver
		.findElement( webdriver.By.name( 'q' ) )
		.sendKeys( 'BrowserStack\n' )
		.then( function() {
			driver.getTitle().then( function( title ) {
				process.stdout.write( title );
				driver.quit();
			} );
		} );
} );
