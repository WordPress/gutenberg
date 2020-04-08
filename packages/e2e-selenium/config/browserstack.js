const browserstack = require( 'browserstack-local' );
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
	'browserstack.local': true,
	name: 'Bstack-[Node] Sample Test',
};

const setupDriver = async () => {
	return new webdriver.Builder()
		.usingServer( 'http://hub-cloud.browserstack.com/wd/hub' )
		.withCapabilities( capabilities )
		.build();
};

const browserstackLocal = new browserstack.Local();

const startBrowserStackLocal = async () => {
	return new Promise( ( resolve, reject ) => {
		browserstackLocal.start(
			{
				key: process.env.LOCAL_BROWSERSTACK_KEY,
			},
			function( err ) {
				if ( err ) {
					reject( err );
				}

				resolve();
			}
		);
	} );
};

const stopBrowserStackLocal = async () => {
	return new Promise( ( resolve ) => {
		browserstackLocal.stop( function() {
			resolve();
		} );
	} );
};

module.exports = {
	setupDriver,
	webdriver,
	startBrowserStackLocal,
	stopBrowserStackLocal,
};
