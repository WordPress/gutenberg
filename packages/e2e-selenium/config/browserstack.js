const browserstack = require( 'browserstack-local' );
const webdriver = require( 'selenium-webdriver' );
const got = require( 'got' );
require( 'dotenv' ).config();

const {
	LOCAL_BROWSERSTACK_USER,
	LOCAL_BROWSERSTACK_KEY,
	CI_BROWSERSTACK_USER,
	CI_BROWSERSTACK_KEY,
} = process.env;

const NAME = LOCAL_BROWSERSTACK_USER || CI_BROWSERSTACK_USER;
const KEY = LOCAL_BROWSERSTACK_KEY || CI_BROWSERSTACK_KEY;

if ( ! NAME || ! KEY ) {
	throw new Error(
		'username or key is undefined. You cannot connect to BrowserStack.'
	);
}

const capabilities = {
	browserName: 'IE',
	browser_version: '11.0',
	os: 'Windows',
	os_version: '10',
	resolution: '1024x768',
	'browserstack.user': NAME,
	'browserstack.key': KEY,
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
				key: KEY,
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

const getResultPageLink = async ( sessionId ) => {
	const response = await got(
		`https://api.browserstack.com/automate/sessions/${ sessionId }.json`,
		{
			username: NAME,
			password: KEY,
		}
	);

	const body = JSON.parse( response.body );

	return body.automation_session.public_url;
};

module.exports = {
	setupDriver,
	webdriver,
	startBrowserStackLocal,
	stopBrowserStackLocal,
	getResultPageLink,
};
